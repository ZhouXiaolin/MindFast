import type { AgentMessage, AgentState } from "@mariozechner/pi-agent-core";
import type { SessionMetadata } from "../pi/storage/types";
import { ArtifactsStore } from "../pi/artifacts/store";

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

function extractTextBlocks(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((block) => typeof block === "object" && block !== null && "type" in block)
    .filter((block) => (block as { type: string }).type === "text")
    .map((block) => (block as { text?: string }).text ?? "")
    .join("\n");
}

function extractMessageText(message: AgentMessage): string {
  if (message.role === "user" || message.role === "assistant") {
    return extractTextBlocks((message as { content?: unknown }).content).trim();
  }
  return "";
}

function toSingleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getArtifactKind(filename: string): WorkspaceArtifactKind {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  return "text";
}

export function buildSessionTitle(messages: AgentMessage[]): string {
  const firstUserText = messages.find((message) => message.role === "user");
  const text = firstUserText ? toSingleLine(extractMessageText(firstUserText)) : "";
  return text ? truncate(text, 48) : "New chat";
}

export function buildSessionPreview(messages: AgentMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const text = toSingleLine(extractMessageText(messages[index]));
    if (text) {
      return truncate(text, 120);
    }
  }
  return "";
}

function buildUsage(messages: AgentMessage[]): SessionMetadata["usage"] {
  let input = 0;
  let output = 0;
  let cacheRead = 0;
  let cacheWrite = 0;
  let costInput = 0;
  let costOutput = 0;
  let costCacheRead = 0;
  let costCacheWrite = 0;
  let costTotal = 0;

  for (const message of messages) {
    if (message.role !== "assistant") continue;

    const usage = (message as {
      usage?: {
        input?: number;
        output?: number;
        cacheRead?: number;
        cacheWrite?: number;
        cost?: {
          input?: number;
          output?: number;
          cacheRead?: number;
          cacheWrite?: number;
          total?: number;
        };
      };
    }).usage;

    input += usage?.input ?? 0;
    output += usage?.output ?? 0;
    cacheRead += usage?.cacheRead ?? 0;
    cacheWrite += usage?.cacheWrite ?? 0;
    costInput += usage?.cost?.input ?? 0;
    costOutput += usage?.cost?.output ?? 0;
    costCacheRead += usage?.cost?.cacheRead ?? 0;
    costCacheWrite += usage?.cost?.cacheWrite ?? 0;
    costTotal += usage?.cost?.total ?? 0;
  }

  return {
    input,
    output,
    cacheRead,
    cacheWrite,
    totalTokens: input + output + cacheRead + cacheWrite,
    cost: {
      input: costInput,
      output: costOutput,
      cacheRead: costCacheRead,
      cacheWrite: costCacheWrite,
      total: costTotal,
    },
  };
}

export function buildSessionMetadata(
  sessionId: string,
  state: AgentState,
  existingMetadata?: SessionMetadata | null
): SessionMetadata {
  const messages = state.messages ?? [];

  return {
    id: sessionId,
    title: buildSessionTitle(messages),
    createdAt: existingMetadata?.createdAt ?? new Date().toISOString(),
    lastModified: new Date().toISOString(),
    messageCount: messages.filter((message) => message.role === "user" || message.role === "assistant").length,
    usage: buildUsage(messages),
    thinkingLevel: state.thinkingLevel ?? existingMetadata?.thinkingLevel ?? "off",
    preview: buildSessionPreview(messages),
  };
}

function buildArtifactPreviewText(content: string): string {
  return truncate(toSingleLine(content), 140);
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
