import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { SubtaskRun } from "../subagent-types";
import { extractItemsByKind, extractItemsByKindFromSubtaskRuns } from "../../extensions/extract";

export interface SavedWidgetSummary {
  content: string;
  filename: string;
  previewText: string;
  sessionId: string;
  sessionTitle: string;
  updatedAt: string;
  widgetId: string;
}

const WIDGET_TRUNCATE = { maxLength: 220, collapseWhitespace: false };

function toSummary(item: { id: string; filename: string; content: string; previewText: string; sessionId: string; sessionTitle: string; updatedAt: string }): SavedWidgetSummary {
  return {
    content: item.content,
    filename: item.filename,
    previewText: item.previewText,
    sessionId: item.sessionId,
    sessionTitle: item.sessionTitle,
    updatedAt: item.updatedAt,
    widgetId: item.id,
  };
}

export function extractWidgetsFromMessages(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  messages: AgentMessage[]
): SavedWidgetSummary[] {
  return extractItemsByKind("widget", sessionId, sessionTitle, updatedAt, messages, WIDGET_TRUNCATE).map(toSummary);
}

export function extractWidgetsFromSubtaskRuns(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  runs: Record<string, SubtaskRun> | null | undefined
): SavedWidgetSummary[] {
  return extractItemsByKindFromSubtaskRuns("widget", sessionId, sessionTitle, updatedAt, runs, WIDGET_TRUNCATE).map(toSummary);
}
