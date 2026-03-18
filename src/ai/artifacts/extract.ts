import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { ArtifactsStore } from "./store";

export type WorkspaceArtifactKind = "html" | "markdown" | "text";

export interface SavedArtifactSummary {
  sessionId: string;
  sessionTitle: string;
  filename: string;
  content: string;
  kind: WorkspaceArtifactKind;
  updatedAt: string;
  previewText: string;
}

function toSingleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

function buildArtifactPreviewText(content: string): string {
  return truncate(toSingleLine(content), 140);
}

function getArtifactKind(filename: string): WorkspaceArtifactKind {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  return "text";
}

export function extractArtifactsFromMessages(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  messages: AgentMessage[]
): SavedArtifactSummary[] {
  const store = new ArtifactsStore();
  store.reconstructFromMessages(messages);

  return store.getSnapshot().map(([, artifact]) => ({
    sessionId,
    sessionTitle,
    filename: artifact.filename,
    content: artifact.content,
    kind: getArtifactKind(artifact.filename),
    updatedAt,
    previewText: buildArtifactPreviewText(artifact.content),
  }));
}
