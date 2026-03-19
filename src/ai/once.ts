import { completeSimple, type AssistantMessage, type Model, type ThinkingLevel } from "@mariozechner/pi-ai";

export interface OnceOptions {
  model: Model<any>;
  getApiKey: (provider: string) => Promise<string | undefined>;
  prompt: string;
  systemPrompt?: string;
  thinkingLevel?: string;
  signal?: AbortSignal;
  maxTokens?: number;
}

function toReasoningLevel(thinkingLevel?: string): ThinkingLevel | undefined {
  if (!thinkingLevel || thinkingLevel === "off") return undefined;
  return thinkingLevel as ThinkingLevel;
}

function extractAssistantText(message: AssistantMessage): string {
  return message.content
    .filter((part): part is Extract<AssistantMessage["content"][number], { type: "text" }> => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export async function once(options: OnceOptions): Promise<string> {
  const apiKey = await options.getApiKey(options.model.provider);
  const message = await completeSimple(
    options.model,
    {
      systemPrompt: options.systemPrompt,
      messages: [
        {
          role: "user",
          content: options.prompt,
          timestamp: Date.now(),
        },
      ],
    },
    {
      apiKey,
      signal: options.signal,
      maxTokens: options.maxTokens,
      reasoning: toReasoningLevel(options.thinkingLevel),
    }
  );

  return extractAssistantText(message);
}
