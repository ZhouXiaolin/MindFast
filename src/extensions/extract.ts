import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { SubtaskRun } from "../ai/subagent-types";
import { normalizeWorkspacePath } from "../ai/path-utils";
import { WorkspaceStore } from "../ai/workspace/store";
import { resolveWorkspaceKind } from "./registry";

export interface ExtractedItem {
  id: string;
  kind: string;
  filename: string;
  content: string;
  previewText: string;
  sessionId: string;
  sessionTitle: string;
  updatedAt: string;
}

export interface TruncateOptions {
  maxLength: number;
  collapseWhitespace?: boolean;
}

const DEFAULT_TRUNCATE: TruncateOptions = { maxLength: 140, collapseWhitespace: true };

function truncatePreview(content: string, options: TruncateOptions = DEFAULT_TRUNCATE): string {
  const text = options.collapseWhitespace !== false
    ? content.replace(/\s+/g, " ").trim()
    : content.trim();
  if (text.length <= options.maxLength) return text;
  return `${text.slice(0, options.maxLength).trimEnd()}…`;
}

export function extractItemsByKind(
  targetKind: string,
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  messages: AgentMessage[],
  truncateOptions: TruncateOptions = DEFAULT_TRUNCATE
): ExtractedItem[] {
  const store = new WorkspaceStore();
  store.reconstructFromMessages(messages);

  return store
    .getSnapshot()
    .filter(([, file]) => resolveWorkspaceKind(file.filename) === targetKind)
    .map(([, file]) => {
      const normalized = normalizeWorkspacePath(file.filename);
      return {
        id: file.id ?? `main:${normalized}`,
        kind: targetKind,
        filename: normalized,
        content: file.content,
        previewText: truncatePreview(file.content, truncateOptions),
        sessionId,
        sessionTitle,
        updatedAt,
      };
    });
}

export function extractItemsByKindFromSubtaskRuns(
  targetKind: string,
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  runs: Record<string, SubtaskRun> | null | undefined,
  truncateOptions: TruncateOptions = DEFAULT_TRUNCATE
): ExtractedItem[] {
  if (!runs) return [];

  return Object.entries(runs).flatMap(([runKey, run]) =>
    run.files
      .filter((file) => resolveWorkspaceKind(file.filename) === targetKind)
      .map((file, index) => {
        const normalized = normalizeWorkspacePath(file.filename);
        return {
          id: file.id ?? `subtask:${runKey}:${index}:${normalized}`,
          kind: targetKind,
          filename: normalized,
          content: file.content,
          previewText: truncatePreview(file.content, truncateOptions),
          sessionId,
          sessionTitle,
          updatedAt,
        };
      })
  );
}
