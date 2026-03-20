import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { SubtaskRun } from "../subagent-types";
import { isWidgetPath, normalizeWorkspacePath } from "../workspace-types";
import { WorkspaceStore } from "../workspace/store";

export interface SavedWidgetSummary {
  content: string;
  filename: string;
  previewText: string;
  sessionId: string;
  sessionTitle: string;
  updatedAt: string;
  widgetId: string;
}

function buildWidgetPreviewText(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 220) {
    return trimmed;
  }
  return `${trimmed.slice(0, 220).trimEnd()}…`;
}

function toSavedWidgetSummary(
  widgetId: string,
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  filename: string,
  content: string
): SavedWidgetSummary {
  return {
    content,
    filename: normalizeWorkspacePath(filename),
    previewText: buildWidgetPreviewText(content),
    sessionId,
    sessionTitle,
    updatedAt,
    widgetId,
  };
}

function getWidgetId(file: { id?: string }, fallbackId: string): string {
  return file.id ?? fallbackId;
}

export function extractWidgetsFromMessages(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  messages: AgentMessage[]
): SavedWidgetSummary[] {
  const store = new WorkspaceStore();
  store.reconstructFromMessages(messages);

  return store
    .getSnapshot()
    .filter(([, widget]) => isWidgetPath(widget.filename))
    .map(([, widget]) =>
      toSavedWidgetSummary(
        getWidgetId(widget, `main:${widget.filename}`),
        sessionId,
        sessionTitle,
        updatedAt,
        widget.filename,
        widget.content
      )
    );
}

export function extractWidgetsFromSubtaskRuns(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  runs: Record<string, SubtaskRun> | null | undefined
): SavedWidgetSummary[] {
  if (!runs) return [];

  return Object.entries(runs).flatMap(([runKey, run]) =>
    run.files
      .filter((widget) => isWidgetPath(widget.filename))
      .map((widget, index) =>
        toSavedWidgetSummary(
          getWidgetId(widget, `subtask:${runKey}:${index}:${widget.filename}`),
          sessionId,
          sessionTitle,
          updatedAt,
          widget.filename,
          widget.content
        )
      )
  );
}
