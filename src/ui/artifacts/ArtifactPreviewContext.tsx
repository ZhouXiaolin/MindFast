import { createContext, useContext, useMemo } from "react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { AssistantMessage, ToolCall, ToolResultMessage } from "@mariozechner/pi-ai";
import type { WorkspaceFile } from "../../ai/workspace/types";
import {
  isArtifactPath,
  isWidgetPath,
  normalizeWorkspacePath,
} from "../../ai/workspace-types";
import { getFileType, type ArtifactFileType } from "./types";

type ArtifactPreviewOperation = "write" | "edit";
type ArtifactPreviewPhase = "committed" | "pending" | "stream";

export interface ArtifactPreviewEntry {
  canRenderContent: boolean;
  content?: string;
  fileType: ArtifactFileType;
  operation: ArtifactPreviewOperation;
  path: string;
  phase: ArtifactPreviewPhase;
  refreshToken?: string;
  statusText: string | null;
  toolCallId?: string;
}

interface ArtifactPreviewContextValue {
  entries: Map<string, ArtifactPreviewEntry>;
}

interface ResolvedArtifactContent {
  content: string;
  entry: ArtifactPreviewEntry | null;
  fileType: ArtifactFileType;
  isLive: boolean;
  refreshToken: string | null;
  statusText: string | null;
}

const ArtifactPreviewContext = createContext<ArtifactPreviewContextValue | null>(null);

const DEFAULT_CONTEXT_VALUE: ArtifactPreviewContextValue = {
  entries: new Map(),
};

const TEXT_STREAMABLE_FILE_TYPES = new Set<ArtifactFileType>([
  "generic",
  "html",
  "javascript",
  "markdown",
  "python",
  "svg",
  "text",
]);

function isPreviewPath(path?: string): path is string {
  return !!path && (isArtifactPath(path) || isWidgetPath(path));
}

function isTextStreamableFileType(fileType: ArtifactFileType): boolean {
  return TEXT_STREAMABLE_FILE_TYPES.has(fileType);
}

function getStatusText(
  operation: ArtifactPreviewOperation,
  path: string,
  fileType: ArtifactFileType
): string {
  const targetLabel = isWidgetPath(path) ? "widget" : "artifact";
  if (isTextStreamableFileType(fileType)) {
    return operation === "edit" ? `Updating ${targetLabel}...` : `Writing ${targetLabel}...`;
  }
  return operation === "edit"
    ? `Updating ${fileType} artifact...`
    : `Generating ${fileType} artifact...`;
}

function getToolCallPath(toolCall: ToolCall): string | undefined {
  const args = toolCall.arguments;
  if (!args || typeof args !== "object") {
    return undefined;
  }

  const path = (args as { path?: unknown }).path;
  return typeof path === "string" ? normalizeWorkspacePath(path) : undefined;
}

function getToolCallArgs(toolCall: ToolCall): {
  content?: string;
  new_str?: string;
  old_str?: string;
} {
  const args = toolCall.arguments;
  if (!args || typeof args !== "object") {
    return {};
  }

  const toolArgs = args as {
    content?: unknown;
    new_str?: unknown;
    old_str?: unknown;
  };

  return {
    content: typeof toolArgs.content === "string" ? toolArgs.content : undefined,
    new_str: typeof toolArgs.new_str === "string" ? toolArgs.new_str : undefined,
    old_str: typeof toolArgs.old_str === "string" ? toolArgs.old_str : undefined,
  };
}

function buildStreamingWriteEntry(
  toolCall: ToolCall,
  phase: Extract<ArtifactPreviewPhase, "pending" | "stream">
): ArtifactPreviewEntry | null {
  const path = getToolCallPath(toolCall);
  if (!isPreviewPath(path)) {
    return null;
  }

  const fileType = getFileType(path);
  const { content } = getToolCallArgs(toolCall);
  const canRenderContent = isTextStreamableFileType(fileType);

  return {
    canRenderContent,
    content: canRenderContent ? content ?? "" : undefined,
    fileType,
    operation: "write",
    path,
    phase,
    statusText: getStatusText("write", path, fileType),
    toolCallId: toolCall.id,
  };
}

function buildPendingEditEntry(
  toolCall: ToolCall,
  committedByPath: Map<string, WorkspaceFile>,
  entries: Map<string, ArtifactPreviewEntry>,
  phase: Extract<ArtifactPreviewPhase, "pending" | "stream">
): ArtifactPreviewEntry | null {
  const path = getToolCallPath(toolCall);
  if (!isPreviewPath(path)) {
    return null;
  }

  const fileType = getFileType(path);
  const currentEntry = entries.get(path);
  const currentContent = currentEntry?.content ?? committedByPath.get(path)?.content;
  const canRenderContent = isTextStreamableFileType(fileType) && currentContent !== undefined;

  return {
    canRenderContent,
    content: canRenderContent ? currentContent : undefined,
    fileType,
    operation: "edit",
    path,
    phase,
    refreshToken: currentEntry?.refreshToken,
    statusText: getStatusText("edit", path, fileType),
    toolCallId: toolCall.id,
  };
}

function buildCommittedEditEntry(
  toolCall: ToolCall,
  committedByPath: Map<string, WorkspaceFile>
): ArtifactPreviewEntry | null {
  const path = getToolCallPath(toolCall);
  if (!isPreviewPath(path)) {
    return null;
  }

  const fileType = getFileType(path);
  const content = committedByPath.get(path)?.content;
  const canRenderContent = isTextStreamableFileType(fileType) && content !== undefined;

  return {
    canRenderContent,
    content: canRenderContent ? content : undefined,
    fileType,
    operation: "edit",
    path,
    phase: "committed",
    refreshToken: toolCall.id,
    statusText: null,
    toolCallId: toolCall.id,
  };
}

function collectAssistantToolCalls(
  message: AgentMessage | null | undefined
): ToolCall[] {
  if (!message || message.role !== "assistant") {
    return [];
  }

  return ((message as AssistantMessage).content ?? [])
    .filter((chunk): chunk is ToolCall => chunk.type === "toolCall");
}

function buildToolCallsById(messages: AgentMessage[]): Map<string, ToolCall> {
  const toolCallsById = new Map<string, ToolCall>();

  for (const message of messages) {
    for (const toolCall of collectAssistantToolCalls(message)) {
      toolCallsById.set(toolCall.id, toolCall);
    }
  }

  return toolCallsById;
}

export function useArtifactPreviewEntries(
  messages: AgentMessage[],
  streamMessage: AgentMessage | null,
  pendingToolCalls: Set<string>,
  workspaceFiles: WorkspaceFile[]
): Map<string, ArtifactPreviewEntry> {
  return useMemo(() => {
    const committedByPath = new Map<string, WorkspaceFile>();
    for (const file of workspaceFiles) {
      committedByPath.set(normalizeWorkspacePath(file.filename), file);
    }

    const toolCallsById = buildToolCallsById(messages);
    const toolResultsById = new Map<string, ToolResultMessage>();
    for (const message of messages) {
      if (message.role !== "toolResult") {
        continue;
      }

      const toolResult = message as ToolResultMessage & { toolCallId: string };
      toolResultsById.set(toolResult.toolCallId, toolResult);
    }

    const entries = new Map<string, ArtifactPreviewEntry>();

    for (const message of messages) {
      if (message.role !== "toolResult") {
        continue;
      }

      const toolResult = message as ToolResultMessage & { toolCallId: string };
      if (toolResult.isError || toolResult.toolName !== "edit") {
        continue;
      }

      const toolCall = toolCallsById.get(toolResult.toolCallId);
      if (!toolCall) {
        continue;
      }

      const entry = buildCommittedEditEntry(toolCall, committedByPath);
      if (entry) {
        entries.set(entry.path, entry);
      }
    }

    for (const message of messages) {
      for (const toolCall of collectAssistantToolCalls(message)) {
        if (!pendingToolCalls.has(toolCall.id) || toolResultsById.has(toolCall.id)) {
          continue;
        }

        const entry = toolCall.name === "write"
          ? buildStreamingWriteEntry(toolCall, "pending")
          : toolCall.name === "edit"
            ? buildPendingEditEntry(toolCall, committedByPath, entries, "pending")
            : null;
        if (entry) {
          entries.set(entry.path, entry);
        }
      }
    }

    for (const toolCall of collectAssistantToolCalls(streamMessage)) {
      const entry = toolCall.name === "write"
        ? buildStreamingWriteEntry(toolCall, "stream")
        : toolCall.name === "edit"
          ? buildPendingEditEntry(toolCall, committedByPath, entries, "stream")
          : null;
      if (entry) {
        entries.set(entry.path, entry);
      }
    }

    return entries;
  }, [messages, pendingToolCalls, streamMessage, workspaceFiles]);
}

export function ArtifactPreviewProvider({
  entries,
  children,
}: {
  entries: Map<string, ArtifactPreviewEntry>;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ entries }), [entries]);
  return (
    <ArtifactPreviewContext.Provider value={value}>
      {children}
    </ArtifactPreviewContext.Provider>
  );
}

export function useResolvedArtifactContent(
  filename: string,
  fallbackContent: string
): ResolvedArtifactContent {
  const context = useContext(ArtifactPreviewContext) ?? DEFAULT_CONTEXT_VALUE;
  const normalizedPath = normalizeWorkspacePath(filename);
  const entry = context.entries.get(normalizedPath) ?? null;

  if (!entry) {
    return {
      content: fallbackContent,
      entry: null,
      fileType: getFileType(filename),
      isLive: false,
      refreshToken: null,
      statusText: null,
    };
  }

  return {
    content: entry.canRenderContent ? entry.content ?? fallbackContent : fallbackContent,
    entry,
    fileType: entry.fileType,
    isLive: entry.phase !== "committed",
    refreshToken: entry.refreshToken ?? null,
    statusText: entry.statusText,
  };
}
