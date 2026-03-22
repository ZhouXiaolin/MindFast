import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { SubtaskRun } from "../subagent-types";
import { extractItemsByKind, extractItemsByKindFromSubtaskRuns } from "../../extensions/extract";

export type WorkspaceArtifactKind = "html" | "markdown" | "text";

export interface SavedArtifactSummary {
  artifactId: string;
  sessionId: string;
  sessionTitle: string;
  filename: string;
  content: string;
  kind: WorkspaceArtifactKind;
  updatedAt: string;
  previewText: string;
}

function getArtifactKind(filename: string): WorkspaceArtifactKind {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  return "text";
}

function toSummary(item: { id: string; filename: string; content: string; previewText: string; sessionId: string; sessionTitle: string; updatedAt: string }): SavedArtifactSummary {
  return {
    artifactId: item.id,
    sessionId: item.sessionId,
    sessionTitle: item.sessionTitle,
    filename: item.filename,
    content: item.content,
    kind: getArtifactKind(item.filename),
    updatedAt: item.updatedAt,
    previewText: item.previewText,
  };
}

export function extractArtifactsFromMessages(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  messages: AgentMessage[]
): SavedArtifactSummary[] {
  return extractItemsByKind("artifact", sessionId, sessionTitle, updatedAt, messages).map(toSummary);
}

export function extractArtifactsFromSubtaskRuns(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  runs: Record<string, SubtaskRun> | null | undefined
): SavedArtifactSummary[] {
  return extractItemsByKindFromSubtaskRuns("artifact", sessionId, sessionTitle, updatedAt, runs).map(toSummary);
}
