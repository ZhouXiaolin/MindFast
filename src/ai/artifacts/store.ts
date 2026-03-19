import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { ToolCall } from "@mariozechner/pi-ai";
import { ARTIFACTS_DIR, WIDGETS_DIR, getDisplayPath, getParentPath, normalizeWorkspacePath } from "../workspace-types";
import type { Artifact, ArtifactMessage, ArtifactsParams } from "./types";

function createArtifactId(seed?: string): string {
  if (seed) {
    return `artifact:${seed}`;
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface WriteFileResult {
  action: "create" | "update";
  file: Artifact;
  message: string;
}

interface EditFileResult {
  file: Artifact;
  message: string;
}

interface WorkspaceEntry {
  path: string;
  type: "file" | "dir";
}

function createNotFoundMessage(path: string, availablePaths: string[]): string {
  if (availablePaths.length === 0) {
    return `Error: File ${path} not found. No files have been created yet.`;
  }
  return `Error: File ${path} not found. Available files: ${availablePaths.join(", ")}`;
}

function sortEntries(entries: WorkspaceEntry[]): WorkspaceEntry[] {
  return entries.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "dir" ? -1 : 1;
    }
    return left.path.localeCompare(right.path);
  });
}

export class ArtifactsStore {
  private _artifacts = new Map<string, Artifact>();
  private _directories = new Set<string>();
  onChange: (() => void) | null = null;

  constructor() {
    this.resetDirectories();
  }

  get artifacts(): Map<string, Artifact> {
    return this._artifacts;
  }

  getSnapshot(): Array<[string, Artifact]> {
    return Array.from(this._artifacts.entries());
  }

  listAllPaths(): string[] {
    return Array.from(this._artifacts.keys()).sort((left, right) => left.localeCompare(right));
  }

  private emit(): void {
    this.onChange?.();
  }

  private resetDirectories(): void {
    this._directories = new Set([ARTIFACTS_DIR, WIDGETS_DIR]);
  }

  private ensureDirectory(path: string): void {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) return;

    const segments = normalizedPath.split("/");
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      this._directories.add(current);
    }
  }

  private ensureParentDirectories(path: string): void {
    const parentPath = getParentPath(path);
    if (!parentPath) return;
    this.ensureDirectory(parentPath);
  }

  hasPath(path: string): boolean {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) return true;
    return this._artifacts.has(normalizedPath) || this._directories.has(normalizedPath);
  }

  private upsertFile(path: string, content: string, existingId?: string): Artifact {
    const normalizedPath = normalizeWorkspacePath(path);
    const now = new Date();
    const existing = this._artifacts.get(normalizedPath);
    this.ensureParentDirectories(normalizedPath);
    const file: Artifact = {
      id: existing?.id ?? existingId ?? createArtifactId(normalizedPath),
      filename: normalizedPath,
      content,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this._artifacts.set(normalizedPath, file);
    this._artifacts = new Map(this._artifacts);
    this.emit();
    return file;
  }

  writeFile(path: string, content: string): WriteFileResult | string {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) {
      return "Error: write requires a non-empty path";
    }

    const existing = this._artifacts.get(normalizedPath);
    const file = this.upsertFile(normalizedPath, content, existing?.id);
    return {
      action: existing ? "update" : "create",
      file,
      message: `${existing ? "Updated" : "Created"} file ${normalizedPath}`,
    };
  }

  editFile(path: string, oldText: string, newText: string): EditFileResult | string {
    return this.editFileWithOptions(path, oldText, newText);
  }

  editFileWithOptions(
    path: string,
    oldText: string,
    newText: string,
    options: { append?: boolean } = {}
  ): EditFileResult | string {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) {
      return "Error: edit requires a non-empty path";
    }

    const existing = this._artifacts.get(normalizedPath);
    if (!existing) {
      return createNotFoundMessage(normalizedPath, this.listAllPaths());
    }

    if (options.append) {
      const file = this.upsertFile(normalizedPath, `${existing.content}${newText}`, existing.id);
      return {
        file,
        message: `Appended to file ${normalizedPath}`,
      };
    }

    if (!oldText) {
      return "Error: edit requires old_str unless append is true";
    }
    if (!existing.content.includes(oldText)) {
      return `Error: String not found in file. Here is the full content:\n\n${existing.content}`;
    }

    const file = this.upsertFile(normalizedPath, existing.content.replace(oldText, newText), existing.id);
    return {
      file,
      message: `Edited file ${normalizedPath}`,
    };
  }

  readFile(path: string): string {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) {
      return "Error: read requires a non-empty path";
    }

    const existing = this._artifacts.get(normalizedPath);
    if (!existing) {
      return createNotFoundMessage(normalizedPath, this.listAllPaths());
    }
    return existing.content;
  }

  deleteFile(path: string): string {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) {
      return "Error: delete requires a non-empty path";
    }

    const existing = this._artifacts.get(normalizedPath);
    if (!existing) {
      return createNotFoundMessage(normalizedPath, this.listAllPaths());
    }

    this._artifacts.delete(normalizedPath);
    this._artifacts = new Map(this._artifacts);
    this.emit();
    return `Deleted file ${normalizedPath}`;
  }

  mkdir(path: string): string {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) {
      return "Error: mkdir requires a non-empty path";
    }

    const sizeBefore = this._directories.size;
    this.ensureDirectory(normalizedPath);
    if (this._directories.size !== sizeBefore) {
      this.emit();
    }
    return `Created directory ${normalizedPath}`;
  }

  listEntries(path = ""): WorkspaceEntry[] | null {
    const normalizedPath = normalizeWorkspacePath(path);
    const prefix = normalizedPath ? `${normalizedPath}/` : "";

    if (normalizedPath && !this.hasPath(normalizedPath)) {
      return null;
    }

    if (normalizedPath && this._artifacts.has(normalizedPath)) {
      return [{ path: normalizedPath, type: "file" }];
    }

    const entries = new Map<string, WorkspaceEntry>();
    for (const directoryPath of this._directories) {
      if (normalizedPath && !directoryPath.startsWith(prefix)) {
        continue;
      }

      const rest = normalizedPath ? directoryPath.slice(prefix.length) : directoryPath;
      if (!rest) continue;

      const [firstSegment] = rest.split("/");
      const entryPath = normalizedPath ? `${normalizedPath}/${firstSegment}` : firstSegment;
      entries.set(entryPath, {
        path: entryPath,
        type: "dir",
      });
    }

    for (const filePath of this._artifacts.keys()) {
      if (normalizedPath && !filePath.startsWith(prefix)) {
        continue;
      }

      const rest = normalizedPath ? filePath.slice(prefix.length) : filePath;
      if (!rest) continue;

      const [firstSegment, ...remainingSegments] = rest.split("/");
      const entryPath = normalizedPath ? `${normalizedPath}/${firstSegment}` : firstSegment;
      entries.set(entryPath, {
        path: entryPath,
        type: remainingSegments.length > 0 ? "dir" : "file",
      });
    }

    return sortEntries(Array.from(entries.values()));
  }

  findEntries(query = "", path = ""): WorkspaceEntry[] {
    const normalizedQuery = query.trim().toLowerCase();
    const entries = [
      ...Array.from(this._directories).map((directoryPath) => ({ path: directoryPath, type: "dir" as const })),
      ...this.listAllPaths().map((filePath) => ({ path: filePath, type: "file" as const })),
    ]
      .filter((entry) => {
        if (!path) return true;
        const normalizedPath = normalizeWorkspacePath(path);
        return entry.path === normalizedPath || entry.path.startsWith(`${normalizedPath}/`);
      })
      .filter((entry) => {
        if (!normalizedQuery) return true;
        return entry.path.toLowerCase().includes(normalizedQuery);
      });

    return sortEntries(entries);
  }

  getLogs(_path: string): string {
    return "Logs are only available for rendered HTML artifacts in the full runtime.";
  }

  async executeCommand(params: ArtifactsParams): Promise<string> {
    switch (params.command) {
      case "create":
      case "rewrite": {
        if (params.content === undefined) {
          return `Error: ${params.command} command requires content`;
        }
        const result = this.writeFile(params.filename, params.content);
        return typeof result === "string" ? result : result.message;
      }
      case "update": {
        if (params.old_str === undefined || params.new_str === undefined) {
          return "Error: update command requires old_str and new_str";
        }
        const result = this.editFileWithOptions(params.filename, params.old_str, params.new_str);
        return typeof result === "string" ? result : result.message;
      }
      case "get":
        return this.readFile(params.filename);
      case "delete":
        return this.deleteFile(params.filename);
      case "logs":
        return this.getLogs(params.filename);
      default:
        return `Error: Unknown command ${(params as ArtifactsParams).command}`;
    }
  }

  reconstructFromMessages(
    messages: Array<AgentMessage | { role: "aborted" } | { role: "artifact" }>
  ): void {
    const toolCalls = new Map<string, ToolCall>();
    const supportedToolNames = new Set(["write", "edit"]);

    for (const message of messages) {
      if (message.role !== "assistant" || !("content" in message)) {
        continue;
      }

      for (const block of message.content) {
        if (
          typeof block === "object" &&
          block !== null &&
          "type" in block &&
          (block as { type: string }).type === "toolCall" &&
          supportedToolNames.has((block as { name: string }).name)
        ) {
          const toolCall = block as ToolCall;
          toolCalls.set(toolCall.id, toolCall);
        }
      }
    }

    const finalArtifacts = new Map<string, Artifact>();
    this.resetDirectories();

    const upsert = (path: string, content: string, artifactId?: string) => {
      const normalizedPath = normalizeWorkspacePath(path);
      this.ensureParentDirectories(normalizedPath);
      const existing = finalArtifacts.get(normalizedPath);
      finalArtifacts.set(normalizedPath, {
        id: existing?.id ?? artifactId ?? createArtifactId(normalizedPath),
        filename: normalizedPath,
        content,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });
    };

    for (const message of messages) {
      const role = (message as { role?: string }).role;

      if (role === "artifact") {
        const artifactMessage = message as ArtifactMessage;
        const normalizedPath = normalizeWorkspacePath(artifactMessage.filename);
        if (artifactMessage.action === "delete") {
          finalArtifacts.delete(normalizedPath);
        } else if (artifactMessage.content !== undefined) {
          upsert(normalizedPath, artifactMessage.content, createArtifactId(`${artifactMessage.timestamp}:${normalizedPath}`));
        }
        continue;
      }

      if (
        role === "toolResult" &&
        !(message as { isError?: boolean }).isError
      ) {
        const toolResult = message as { toolCallId: string; toolName: string };
        const toolCall = toolCalls.get(toolResult.toolCallId);
        if (!toolCall) continue;

        if (toolResult.toolName === "write") {
          const args = (toolCall as ToolCall & { arguments: { path?: string; content?: string } }).arguments;
          if (args.path && args.content !== undefined) {
            upsert(args.path, args.content, createArtifactId(toolResult.toolCallId));
          }
          continue;
        }

        if (toolResult.toolName === "edit") {
          const args = (toolCall as ToolCall & {
            arguments: { path?: string; old_str?: string; new_str?: string; append?: boolean };
          }).arguments;
          if (!args.path || args.new_str === undefined) {
            continue;
          }

          const normalizedPath = normalizeWorkspacePath(args.path);
          const existing = finalArtifacts.get(normalizedPath);
          if (!existing) continue;

          if (args.append === true) {
            upsert(
              normalizedPath,
              `${existing.content}${args.new_str}`,
              existing.id
            );
            continue;
          }

          if (args.old_str === undefined) {
            continue;
          }

          upsert(
            normalizedPath,
            existing.content.replace(args.old_str, args.new_str),
            existing.id
          );
        }
      }
    }

    this._artifacts.clear();
    for (const [path, artifact] of finalArtifacts.entries()) {
      this._artifacts.set(path, artifact);
    }
    this._artifacts = new Map(this._artifacts);
    this.emit();
  }
}

export function formatWorkspaceEntries(entries: WorkspaceEntry[]): string {
  if (entries.length === 0) {
    return "(empty)";
  }

  return entries
    .map((entry) => entry.type === "dir" ? `${getDisplayPath(entry.path)}/` : getDisplayPath(entry.path))
    .join("\n");
}
