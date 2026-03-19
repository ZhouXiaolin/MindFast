import { Agent } from "@mariozechner/pi-agent-core";
import type { AgentTool, AgentMessage } from "@mariozechner/pi-agent-core";
import { Type, type Static } from "@mariozechner/pi-ai";
import type { ExtendedAppStorage } from "../stores/init";
import { defaultConvertToLlm } from "./convert";
import { ArtifactsStore } from "./artifacts/store";
import { createArtifactsTool } from "./artifacts/tool";
import { once } from "./once";
import {
  getSubtaskRunKey,
  type Subtask,
  type SubtasksToolParams,
  SUBAGENT_TOOL_NAME,
} from "./subagent-types";
import { clearSubtaskRuns, upsertSubtaskRun } from "./subtasks-runtime";
import { countTextTokens } from "./tiktoken";

const subtasksParamsSchema = Type.Object({
  subtasks: Type.Array(
    Type.Object({
      id: Type.String({ description: "Unique subtask id." }),
      label: Type.String({ description: "Short subtask label shown in chat UI." }),
      prompt: Type.String({ description: "Standalone prompt for the subtask agent." }),
    }),
    { description: "Subtasks to run in parallel.", minItems: 1 }
  ),
});

type SubtasksSchema = Static<typeof subtasksParamsSchema>;

const SUBTASKS_TOOL_DESCRIPTION = [
  "Run multiple subtasks in parallel using child agents.",
  "Each subtask contains id, label, prompt.",
  "Use when user explicitly asks for subagent/subtasks or asks for parallel outputs",
  "(for example: same comparison in markdown and html).",
  "Each prompt must be complete and independent.",
].join(" ");

const MAX_SUBTASK_RETURN_TOKENS = 200;
const MAX_PARALLEL_SUBTASKS = 3;
const SUBTASK_SUMMARY_SYSTEM_PROMPT = [
  "You compress a subtask result for a parent agent.",
  "Return plain text only.",
  "Keep exact file paths, function names, errors, counts, and the final conclusion when present.",
  `Keep the answer within ${MAX_SUBTASK_RETURN_TOKENS} tokens.`,
].join(" ");

function cloneMessage<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeUniqueSubtasks(subtasks: Subtask[]): Subtask[] {
  const seen = new Set<string>();
  const result: Subtask[] = [];
  for (const st of subtasks) {
    if (!st.id || seen.has(st.id)) continue;
    seen.add(st.id);
    result.push(st);
  }
  return result;
}

function extractAssistantText(message: AgentMessage): string {
  if (message.role !== "assistant") return "";
  const content = (message as { role: string; content: unknown }).content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((part): part is { type: "text"; text?: string } => {
      return typeof part === "object" && part !== null && (part as { type?: string }).type === "text";
    })
    .map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function extractLastAssistantText(messages: AgentMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const text = extractAssistantText(msg);
    if (text) return text;
  }
  return "";
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>
): Promise<TOutput[]> {
  if (items.length === 0) return [];

  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) {
        return;
      }
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function summarizeSubtaskResult(
  text: string,
  childAgent: Agent,
  storage: ExtendedAppStorage,
  signal?: AbortSignal
): Promise<{ text: string; tokenCount: number; summarizedFrom?: number }> {
  const tokenCount = await countTextTokens(text);
  if (tokenCount <= MAX_SUBTASK_RETURN_TOKENS) {
    return { text, tokenCount };
  }

  let summarized = "";
  try {
    summarized = (await once({
      model: childAgent.state.model,
      thinkingLevel: childAgent.state.thinkingLevel,
      systemPrompt: SUBTASK_SUMMARY_SYSTEM_PROMPT,
      prompt: `Summarize the following subtask result for the parent agent.\n\n${text}`,
      maxTokens: MAX_SUBTASK_RETURN_TOKENS,
      signal,
      getApiKey: async (provider: string) => {
        const key = await storage.providerKeys.get(provider);
        return key ?? undefined;
      },
    })).trim();
  } catch (error) {
    console.warn("Failed to summarize subtask result, returning original text:", error);
  }

  if (!summarized) {
    return { text, tokenCount };
  }

  return {
    text: summarized,
    tokenCount: await countTextTokens(summarized),
    summarizedFrom: tokenCount,
  };
}

export function createSubtasksTool(
  storage: ExtendedAppStorage,
  getAgent: () => Agent | null
): AgentTool<typeof subtasksParamsSchema, { completed: number; failed: number; total: number }> {
  return {
    label: "Subtasks",
    name: SUBAGENT_TOOL_NAME,
    description: SUBTASKS_TOOL_DESCRIPTION,
    parameters: subtasksParamsSchema,
    execute: async (toolCallId: string, args: SubtasksSchema, signal?: AbortSignal) => {
      const parentAgent = getAgent();
      if (!parentAgent) {
        return {
          content: [{ type: "text", text: "Failed: parent agent is unavailable." }],
          details: { completed: 0, failed: 1, total: 1 },
        };
      }

      const subtasks = mergeUniqueSubtasks(args.subtasks as Subtask[]);
      clearSubtaskRuns(subtasks.map((st) => getSubtaskRunKey(toolCallId, st.id)));

      const runOne = async (
        subtask: Subtask
      ): Promise<{ ok: boolean; id: string; label: string; summary: string; tokenCount: number; summarizedFrom?: number }> => {
        let childAgent: Agent | null = null;
        const artifactsStore = new ArtifactsStore();
        let unsubscribe: (() => void) | undefined;
        let abortListener: (() => void) | undefined;
        const runKey = getSubtaskRunKey(toolCallId, subtask.id);

        try {
          let currentChildAgent: Agent | null = null;
          const childArtifactsTool = createArtifactsTool(artifactsStore, () => currentChildAgent);

          childAgent = new Agent({
            initialState: {
              systemPrompt: `${parentAgent.state.systemPrompt}\n\nYou are running as a subtask agent. Always follow the provided subtask prompt directly. You may use the artifacts tool when needed. Do NOT use widgets.`,
              model: parentAgent.state.model,
              thinkingLevel: parentAgent.state.thinkingLevel,
              messages: [],
              tools: [childArtifactsTool],
            },
            convertToLlm: defaultConvertToLlm,
            getApiKey: async (provider: string) => {
              const key = await storage.providerKeys.get(provider);
              return key ?? undefined;
            },
          });
          currentChildAgent = childAgent;

          const syncRunState = () => {
            upsertSubtaskRun(runKey, {
              messages: childAgent!.state.messages.slice(),
              streamMessage: cloneMessage(childAgent!.state.streamMessage ?? null),
              isStreaming: childAgent!.state.isStreaming,
              artifacts: artifactsStore.getSnapshot().map(([, artifact]) => artifact),
            });
          };

          // initialize pending state immediately so UI can show running status
          upsertSubtaskRun(runKey, {
            messages: [],
            streamMessage: null,
            isStreaming: true,
            artifacts: [],
          });

          unsubscribe = childAgent.subscribe(() => {
            syncRunState();
          });

          if (signal) {
            const onAbort = () => {
              childAgent?.abort();
            };
            signal.addEventListener("abort", onAbort);
            abortListener = () => signal.removeEventListener("abort", onAbort);
          }

          await childAgent.prompt(subtask.prompt);
          syncRunState();
          const rawSummary = extractLastAssistantText(childAgent.state.messages);
          const summary = await summarizeSubtaskResult(rawSummary, childAgent, storage, signal);
          return {
            ok: true,
            id: subtask.id,
            label: subtask.label,
            summary: summary.text,
            tokenCount: summary.tokenCount,
            summarizedFrom: summary.summarizedFrom,
          };
        } catch (error) {
          upsertSubtaskRun(runKey, {
            messages: childAgent?.state.messages.slice() ?? [],
            streamMessage: cloneMessage(childAgent?.state.streamMessage ?? null),
            isStreaming: false,
            artifacts: artifactsStore.getSnapshot().map(([, artifact]) => artifact),
            error: error instanceof Error ? error.message : "Subtask failed",
          });
          return { ok: false, id: subtask.id, label: subtask.label, summary: "", tokenCount: 0 };
        } finally {
          unsubscribe?.();
          abortListener?.();
          childAgent?.abort();
        }
      };

      const results = await mapWithConcurrency(subtasks, MAX_PARALLEL_SUBTASKS, runOne);
      const completed = results.filter((r) => r.ok).length;
      const failed = results.length - completed;

      const lines = results.map((r) => {
        const label = r.label || r.id;
        if (r.ok) {
          const tokenText = r.summarizedFrom
            ? `${r.tokenCount} tokens, summarized from ${r.summarizedFrom}`
            : `${r.tokenCount} tokens`;
          return `• ${label} (${tokenText}): ${r.summary || "completed"}`;
        }
        return `• ${label}: failed`;
      });

      const header = `Subtasks done (${completed}/${results.length}${failed ? `, ${failed} failed` : ""}):`;
      const summaryText = `${header}\n${lines.join("\n")}`;

      return {
        content: [{ type: "text", text: summaryText }],
        details: { completed, failed, total: results.length },
      };
    },
  };
}

export type { SubtasksSchema, SubtasksToolParams };
