import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { SubtaskRun } from "../subagent-types";
import { ArtifactsStore } from "./store";

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

function toSavedArtifactSummary(
  artifactId: string,
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  filename: string,
  content: string
): SavedArtifactSummary {
  return {
    artifactId,
    sessionId,
    sessionTitle,
    filename,
    content,
    kind: getArtifactKind(filename),
    updatedAt,
    previewText: buildArtifactPreviewText(content),
  };
}

function getArtifactId(artifact: { id?: string }, fallbackId: string): string {
  return artifact.id ?? fallbackId;
}

export function extractArtifactsFromMessages(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  messages: AgentMessage[]
): SavedArtifactSummary[] {
  const store = new ArtifactsStore();
  store.reconstructFromMessages(messages);

  return store.getSnapshot().map(([, artifact]) =>
    toSavedArtifactSummary(
      getArtifactId(artifact, `main:${artifact.filename}`),
      sessionId,
      sessionTitle,
      updatedAt,
      artifact.filename,
      artifact.content
    )
  );
}

export function extractArtifactsFromSubtaskRuns(
  sessionId: string,
  sessionTitle: string,
  updatedAt: string,
  runs: Record<string, SubtaskRun> | null | undefined
): SavedArtifactSummary[] {
  if (!runs) return [];

  return Object.entries(runs).flatMap(([runKey, run]) =>
    run.artifacts.map((artifact, index) =>
      toSavedArtifactSummary(
        getArtifactId(artifact, `subtask:${runKey}:${index}:${artifact.filename}`),
        sessionId,
        sessionTitle,
        updatedAt,
        artifact.filename,
        artifact.content
      )
    )
  );
}
