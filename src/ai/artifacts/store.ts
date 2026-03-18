import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { ToolCall } from "@mariozechner/pi-ai";
import type { Artifact, ArtifactMessage, ArtifactsParams } from "./types";

export class ArtifactsStore {
  private _artifacts = new Map<string, Artifact>();
  onChange: (() => void) | null = null;

  get artifacts(): Map<string, Artifact> {
    return this._artifacts;
  }

  getSnapshot(): Array<[string, Artifact]> {
    return Array.from(this._artifacts.entries());
  }

  private emit(): void {
    this.onChange?.();
   }

  async executeCommand(
    params: ArtifactsParams,
    options: { skipWait?: boolean; silent?: boolean } = {}
  ): Promise<string> {
    switch (params.command) {
      case "create":
        return this.create(params, options);
      case "update":
        return this.update(params, options);
      case "rewrite":
        return this.rewrite(params, options);
      case "get":
        return this.get(params);
      case "delete":
        return this.delete(params);
      case "logs":
        return this.getLogs(params);
      default:
        return `Error: Unknown command ${(params as ArtifactsParams).command}`;
    }
  }

  private create(
    params: ArtifactsParams,
    _options: { skipWait?: boolean; silent?: boolean } = {}
  ): string {
    if (!params.filename?.trim() || params.content === undefined) {
      return "Error: create command requires filename and content";
    }
    if (this._artifacts.has(params.filename)) {
      return `Error: File ${params.filename} already exists`;
    }
    const artifact: Artifact = {
      filename: params.filename,
      content: params.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._artifacts.set(params.filename, artifact);
    this._artifacts = new Map(this._artifacts);
    this.emit();
    return `Created file ${params.filename}`;
  }

  private update(
    params: ArtifactsParams,
    _options: { skipWait?: boolean; silent?: boolean } = {}
  ): string {
    const artifact = this._artifacts.get(params.filename);
    if (!artifact) {
      const files = Array.from(this._artifacts.keys());
      if (files.length === 0)
        return `Error: File ${params.filename} not found. No files have been created yet.`;
      return `Error: File ${params.filename} not found. Available files: ${files.join(", ")}`;
    }
    if (params.old_str === undefined || params.new_str === undefined) {
      return "Error: update command requires old_str and new_str";
    }
    if (!artifact.content.includes(params.old_str)) {
      return `Error: String not found in file. Here is the full content:\n\n${artifact.content}`;
    }
    artifact.content = artifact.content.replace(params.old_str, params.new_str);
    artifact.updatedAt = new Date();
    this._artifacts.set(params.filename, artifact);
    this._artifacts = new Map(this._artifacts);
    this.emit();
    return `Updated file ${params.filename}`;
  }

  private rewrite(
    params: ArtifactsParams,
    _options: { skipWait?: boolean; silent?: boolean } = {}
  ): string {
    const artifact = this._artifacts.get(params.filename);
    if (!artifact) {
      const files = Array.from(this._artifacts.keys());
      if (files.length === 0)
        return `Error: File ${params.filename} not found. No files have been created yet.`;
      return `Error: File ${params.filename} not found. Available files: ${files.join(", ")}`;
    }
    if (params.content === undefined) {
      return "Error: rewrite command requires content";
    }
    artifact.content = params.content;
    artifact.updatedAt = new Date();
    this._artifacts.set(params.filename, artifact);
    this._artifacts = new Map(this._artifacts);
    this.emit();
    return `Rewrote file ${params.filename}`;
  }

  private get(params: ArtifactsParams): string {
    const artifact = this._artifacts.get(params.filename);
    if (!artifact) {
      const files = Array.from(this._artifacts.keys());
      if (files.length === 0)
        return `Error: File ${params.filename} not found. No files have been created yet.`;
      return `Error: File ${params.filename} not found. Available files: ${files.join(", ")}`;
    }
    return artifact.content;
  }

  private delete(params: ArtifactsParams): string {
    const artifact = this._artifacts.get(params.filename);
    if (!artifact) {
      const files = Array.from(this._artifacts.keys());
      if (files.length === 0)
        return `Error: File ${params.filename} not found. No files have been created yet.`;
      return `Error: File ${params.filename} not found. Available files: ${files.join(", ")}`;
    }
    this._artifacts.delete(params.filename);
    this._artifacts = new Map(this._artifacts);
    this.emit();
    return `Deleted file ${params.filename}`;
  }

  private getLogs(_params: ArtifactsParams): string {
    return "Logs are only available for HTML artifacts in the full runtime.";
  }

  /**
   * Rebuild artifact state from conversation messages (e.g. when loading a session).
   */
  reconstructFromMessages(
    messages: Array<AgentMessage | { role: "aborted" } | { role: "artifact" }>
  ): void {
    const toolCalls = new Map<string, ToolCall>();
    const artifactToolName = "artifacts";

    for (const message of messages) {
      if (message.role === "assistant" && "content" in message) {
        for (const block of message.content) {
          if (
            typeof block === "object" &&
            block !== null &&
            "type" in block &&
            (block as { type: string }).type === "toolCall" &&
            (block as { name: string }).name === artifactToolName
          ) {
            const tc = block as ToolCall;
            toolCalls.set(tc.id, tc);
          }
        }
      }
    }

    const operations: ArtifactsParams[] = [];
    for (const m of messages) {
      const msg = m as { role: string } & Partial<ArtifactMessage>;
      if (msg.role === "artifact") {
        const am = m as ArtifactMessage;
        switch (am.action) {
          case "create":
            operations.push({
              command: "create",
              filename: am.filename,
              content: am.content,
            });
            break;
          case "update":
            operations.push({
              command: "rewrite",
              filename: am.filename,
              content: am.content,
            });
            break;
          case "delete":
            operations.push({ command: "delete", filename: am.filename });
            break;
        }
        continue;
      }
      if (
        msg.role === "toolResult" &&
        (m as { toolName?: string }).toolName === artifactToolName &&
        !(m as { isError?: boolean }).isError
      ) {
        const tr = m as { toolCallId: string; toolName: string };
        const call = toolCalls.get(tr.toolCallId);
        if (!call) continue;
        const params = (call as ToolCall & { arguments: ArtifactsParams }).arguments as ArtifactsParams;
        if (params.command === "get" || params.command === "logs") continue;
        operations.push(params);
      }
    }

    const finalArtifacts = new Map<string, string>();
    for (const op of operations) {
      const filename = op.filename;
      switch (op.command) {
        case "create":
          if (op.content != null) finalArtifacts.set(filename, op.content);
          break;
        case "rewrite":
          if (op.content != null) finalArtifacts.set(filename, op.content);
          break;
        case "update":
          const existing = finalArtifacts.get(filename);
          if (existing != null && op.old_str !== undefined && op.new_str !== undefined) {
            finalArtifacts.set(filename, existing.replace(op.old_str, op.new_str));
          }
          break;
        case "delete":
          finalArtifacts.delete(filename);
          break;
        case "get":
        case "logs":
          break;
      }
    }

    this._artifacts.clear();
    for (const [filename, content] of finalArtifacts.entries()) {
      this._artifacts.set(filename, {
        filename,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    this._artifacts = new Map(this._artifacts);
    this.emit();
  }
}
