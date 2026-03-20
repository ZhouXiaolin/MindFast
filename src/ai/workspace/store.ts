import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { ToolCall } from "@mariozechner/pi-ai";
import { ARTIFACTS_DIR, WIDGETS_DIR, getDisplayPath, getParentPath, normalizeWorkspacePath } from "../workspace-types";
import type { WorkspaceFile, WorkspaceFileMessage, WorkspaceParams } from "./types";

function createWorkspaceFileId(seed?: string): string {
  if (seed) {
    return `workspace:${seed}`;
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface WriteFileResult {
  action: "create" | "update";
  file: WorkspaceFile;
  message: string;
}

interface EditFileResult {
  file: WorkspaceFile;
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

function createShortFileSuffix(seed?: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toLowerCase();
  }

  const normalizedSeed = `${Date.now().toString(36)}${seed ?? ""}${Math.random().toString(36)}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(-6);

  if (normalizedSeed.length >= 4) {
    return normalizedSeed;
  }

  return Math.random().toString(36).slice(2, 8).toLowerCase();
}

function hasGeneratedSuffix(filename: string): boolean {
  return /__[a-z0-9]{4,}(?=\.[^/.]+$|$)/i.test(filename);
}

function createUniqueWritePath(path: string, suffixSeed?: string): string {
  const normalizedPath = normalizeWorkspacePath(path);
  if (!normalizedPath) {
    return "";
  }

  const segments = normalizedPath.split("/");
  const filename = segments.pop() ?? "";
  if (!filename || hasGeneratedSuffix(filename)) {
    return normalizedPath;
  }

  const lastDotIndex = filename.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < filename.length - 1;
  const basename = hasExtension ? filename.slice(0, lastDotIndex) : filename;
  const extension = hasExtension ? filename.slice(lastDotIndex) : "";
  const suffix = createShortFileSuffix(suffixSeed);
  const suffixedFilename = `${basename}__${suffix}${extension}`;

  return segments.length > 0 ? `${segments.join("/")}/${suffixedFilename}` : suffixedFilename;
}

export class WorkspaceStore {
  private _files = new Map<string, WorkspaceFile>();
  private _directories = new Set<string>();
  onChange: (() => void) | null = null;

  constructor() {
    this.resetDirectories();
  }

  get files(): Map<string, WorkspaceFile> {
    return this._files;
  }

  getSnapshot(): Array<[string, WorkspaceFile]> {
    return Array.from(this._files.entries());
  }

  listAllPaths(): string[] {
    return Array.from(this._files.keys()).sort((left, right) => left.localeCompare(right));
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
    return this._files.has(normalizedPath) || this._directories.has(normalizedPath);
  }

  private upsertFile(path: string, content: string, existingId?: string): WorkspaceFile {
    const normalizedPath = normalizeWorkspacePath(path);
    const now = new Date();
    const existing = this._files.get(normalizedPath);
    this.ensureParentDirectories(normalizedPath);
    const file: WorkspaceFile = {
      id: existing?.id ?? existingId ?? createWorkspaceFileId(normalizedPath),
      filename: normalizedPath,
      content,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this._files.set(normalizedPath, file);
    this._files = new Map(this._files);
    this.emit();
    return file;
  }

  writeFile(path: string, content: string, suffixSeed?: string): WriteFileResult | string {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) {
      return "Error: write requires a non-empty path";
    }

    const finalPath = createUniqueWritePath(normalizedPath, suffixSeed);
    const existing = this._files.get(finalPath);
    const file = this.upsertFile(finalPath, content, existing?.id);
    return {
      action: existing ? "update" : "create",
      file,
      message: `${existing ? "Updated" : "Created"} file ${finalPath}`,
    };
  }

  editFile(path: string, oldText: string, newText: string): EditFileResult | string {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!normalizedPath) {
      return "Error: edit requires a non-empty path";
    }

    const existing = this._files.get(normalizedPath);
    if (!existing) {
      return createNotFoundMessage(normalizedPath, this.listAllPaths());
    }

    if (!oldText) {
      return "Error: edit requires old_str";
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

    const existing = this._files.get(normalizedPath);
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

    const existing = this._files.get(normalizedPath);
    if (!existing) {
      return createNotFoundMessage(normalizedPath, this.listAllPaths());
    }

    this._files.delete(normalizedPath);
    this._files = new Map(this._files);
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

    if (normalizedPath && this._files.has(normalizedPath)) {
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

    for (const filePath of this._files.keys()) {
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

  async executeCommand(params: WorkspaceParams): Promise<string> {
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
        const result = this.editFile(params.filename, params.old_str, params.new_str);
        return typeof result === "string" ? result : result.message;
      }
      case "get":
        return this.readFile(params.filename);
      case "delete":
        return this.deleteFile(params.filename);
      case "logs":
        return this.getLogs(params.filename);
      default:
        return `Error: Unknown command ${(params as WorkspaceParams).command}`;
    }
  }

  reconstructFromMessages(
    messages: Array<AgentMessage | { role: "aborted" } | { role: "workspaceFile" }>
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

    const finalFiles = new Map<string, WorkspaceFile>();
    this.resetDirectories();

    const upsert = (path: string, content: string, fileId?: string) => {
      const normalizedPath = normalizeWorkspacePath(path);
      this.ensureParentDirectories(normalizedPath);
      const existing = finalFiles.get(normalizedPath);
      finalFiles.set(normalizedPath, {
        id: existing?.id ?? fileId ?? createWorkspaceFileId(normalizedPath),
        filename: normalizedPath,
        content,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });
    };

    for (const message of messages) {
      const role = (message as { role?: string }).role;

      if (role === "workspaceFile") {
        const workspaceFileMessage = message as WorkspaceFileMessage;
        const normalizedPath = normalizeWorkspacePath(workspaceFileMessage.filename);
        if (workspaceFileMessage.action === "delete") {
          finalFiles.delete(normalizedPath);
        } else if (workspaceFileMessage.content !== undefined) {
          upsert(
            normalizedPath,
            workspaceFileMessage.content,
            createWorkspaceFileId(`${workspaceFileMessage.timestamp}:${normalizedPath}`)
          );
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
          const details = toolResult as {
            details?: { path?: string; content?: string };
          };
          const finalPath = details.details?.path ?? args.path;
          const finalContent = details.details?.content ?? args.content;
          if (finalPath && finalContent !== undefined) {
            upsert(finalPath, finalContent, createWorkspaceFileId(toolResult.toolCallId));
          }
          continue;
        }

        if (toolResult.toolName === "edit") {
          const args = (toolCall as ToolCall & {
            arguments: { path?: string; old_str?: string; new_str?: string };
          }).arguments;
          const finalPath = (toolResult as { details?: { path?: string } }).details?.path ?? args.path;
          if (!finalPath || args.new_str === undefined) {
            continue;
          }

          const normalizedPath = normalizeWorkspacePath(finalPath);
          const existing = finalFiles.get(normalizedPath);
          if (!existing) continue;

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

    this._files.clear();
    for (const [path, file] of finalFiles.entries()) {
      this._files.set(path, file);
    }
    this._files = new Map(this._files);
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
