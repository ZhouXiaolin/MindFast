import { createContext, useContext, useMemo } from "react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { AssistantMessage, ToolCall, ToolResultMessage } from "@mariozechner/pi-ai";
import type { WorkspaceFile } from "../../ai/workspace/types";
import {
  isArtifactPath,
  isWidgetPath,
  normalizeWorkspacePath,
} from "../../ai/workspace-types";
import { getFileType, type ArtifactFileType } from "../artifacts/types";

type LivePreviewOperation = "write" | "edit";
type LivePreviewSource = "pending" | "stream";

export interface LivePreviewEntry {
  canRenderContent: boolean;
  content?: string;
  fileType: ArtifactFileType;
  operation: LivePreviewOperation;
  path: string;
  source: LivePreviewSource;
  statusText: string;
  toolCallId: string;
}

interface LivePreviewContextValue {
  entries: Map<string, LivePreviewEntry>;
}

interface ResolvedPreviewContent {
  content: string;
  fileType: ArtifactFileType;
  isLive: boolean;
  liveEntry: LivePreviewEntry | null;
  statusText: string | null;
}

const LivePreviewContext = createContext<LivePreviewContextValue | null>(null);

const DEFAULT_CONTEXT_VALUE: LivePreviewContextValue = {
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

function isLivePreviewPath(path?: string): path is string {
  return !!path && (isArtifactPath(path) || isWidgetPath(path));
}

function isTextStreamableFileType(fileType: ArtifactFileType): boolean {
  return TEXT_STREAMABLE_FILE_TYPES.has(fileType);
}

function getStatusText(
  operation: LivePreviewOperation,
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

function findUniqueMatchRange(
  content: string,
  oldText: string
): { end: number; start: number } | null {
  if (!oldText) {
    return null;
  }

  const firstIndex = content.indexOf(oldText);
  if (firstIndex < 0) {
    return null;
  }

  const secondIndex = content.indexOf(oldText, firstIndex + oldText.length);
  if (secondIndex >= 0) {
    return null;
  }

  return {
    start: firstIndex,
    end: firstIndex + oldText.length,
  };
}

function buildWriteEntry(toolCall: ToolCall, source: LivePreviewSource): LivePreviewEntry | null {
  const path = getToolCallPath(toolCall);
  if (!isLivePreviewPath(path)) {
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
    source,
    statusText: getStatusText("write", path, fileType),
    toolCallId: toolCall.id,
  };
}

function buildEditEntry(
  toolCall: ToolCall,
  committedByPath: Map<string, WorkspaceFile>,
  source: LivePreviewSource
): LivePreviewEntry | null {
  const path = getToolCallPath(toolCall);
  if (!isLivePreviewPath(path)) {
    return null;
  }

  const fileType = getFileType(path);
  const statusText = getStatusText("edit", path, fileType);
  if (!isTextStreamableFileType(fileType)) {
    return {
      canRenderContent: false,
      fileType,
      operation: "edit",
      path,
      source,
      statusText,
      toolCallId: toolCall.id,
    };
  }

  const baseContent = committedByPath.get(path)?.content;
  if (baseContent === undefined) {
    return {
      canRenderContent: false,
      fileType,
      operation: "edit",
      path,
      source,
      statusText,
      toolCallId: toolCall.id,
    };
  }

  const { old_str: oldText, new_str: newText } = getToolCallArgs(toolCall);
  const matchRange = findUniqueMatchRange(baseContent, oldText ?? "");
  if (!matchRange) {
    return {
      canRenderContent: false,
      fileType,
      operation: "edit",
      path,
      source,
      statusText,
      toolCallId: toolCall.id,
    };
  }

  return {
    canRenderContent: true,
    content: `${baseContent.slice(0, matchRange.start)}${newText ?? ""}${baseContent.slice(matchRange.end)}`,
    fileType,
    operation: "edit",
    path,
    source,
    statusText,
    toolCallId: toolCall.id,
  };
}

function buildLivePreviewEntry(
  toolCall: ToolCall,
  committedByPath: Map<string, WorkspaceFile>,
  source: LivePreviewSource
): LivePreviewEntry | null {
  if (toolCall.name === "write") {
    return buildWriteEntry(toolCall, source);
  }
  if (toolCall.name === "edit") {
    return buildEditEntry(toolCall, committedByPath, source);
  }
  return null;
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

export function useLivePreviewEntries(
  messages: AgentMessage[],
  streamMessage: AgentMessage | null,
  pendingToolCalls: Set<string>,
  workspaceFiles: WorkspaceFile[]
): Map<string, LivePreviewEntry> {
  return useMemo(() => {
    const committedByPath = new Map<string, WorkspaceFile>();
    for (const file of workspaceFiles) {
      committedByPath.set(normalizeWorkspacePath(file.filename), file);
    }

    const toolResultsById = new Map<string, ToolResultMessage>();
    for (const message of messages) {
      if (message.role !== "toolResult") {
        continue;
      }

      const toolResult = message as ToolResultMessage & { toolCallId: string };
      toolResultsById.set(toolResult.toolCallId, toolResult);
    }

    const entries = new Map<string, LivePreviewEntry>();
    for (const message of messages) {
      for (const toolCall of collectAssistantToolCalls(message)) {
        if (!pendingToolCalls.has(toolCall.id) || toolResultsById.has(toolCall.id)) {
          continue;
        }

        const entry = buildLivePreviewEntry(toolCall, committedByPath, "pending");
        if (entry) {
          entries.set(entry.path, entry);
        }
      }
    }

    for (const toolCall of collectAssistantToolCalls(streamMessage)) {
      const entry = buildLivePreviewEntry(toolCall, committedByPath, "stream");
      if (entry) {
        entries.set(entry.path, entry);
      }
    }

    return entries;
  }, [messages, pendingToolCalls, streamMessage, workspaceFiles]);
}

export function LivePreviewProvider({
  children,
  entries,
}: {
  children: React.ReactNode;
  entries: Map<string, LivePreviewEntry>;
}) {
  const value = useMemo(() => ({ entries }), [entries]);
  return (
    <LivePreviewContext.Provider value={value}>
      {children}
    </LivePreviewContext.Provider>
  );
}

export function useResolvedPreviewContent(
  filename: string,
  fallbackContent: string
): ResolvedPreviewContent {
  const context = useContext(LivePreviewContext) ?? DEFAULT_CONTEXT_VALUE;
  const normalizedPath = normalizeWorkspacePath(filename);
  const liveEntry = context.entries.get(normalizedPath) ?? null;

  if (!liveEntry) {
    return {
      content: fallbackContent,
      fileType: getFileType(filename),
      isLive: false,
      liveEntry: null,
      statusText: null,
    };
  }

  return {
    content: liveEntry.canRenderContent ? liveEntry.content ?? "" : fallbackContent,
    fileType: liveEntry.fileType,
    isLive: true,
    liveEntry,
    statusText: liveEntry.statusText,
  };
}
