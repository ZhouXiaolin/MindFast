import type { ProviderModel } from "../pi/stores";

/**
 * Provider models configuration for providers NOT in pi-ai's KnownProvider list.
 *
 * For KnownProviders (openai, anthropic, google, etc.), use pi-ai's getModels() function.
 * This file only contains models for custom/non-known providers.
 */
export interface ProviderModelsConfig {
  id: string;
  models: ProviderModel[];
}

export const CUSTOM_PROVIDER_MODELS: ProviderModelsConfig[] = [
  {
    id: "deepseek",
    models: [
      { id: "deepseek-chat", name: "DeepSeek-V3", description: "DeepSeek's most capable model" },
      { id: "deepseek-reasoner", name: "DeepSeek-R1", description: "DeepSeek's reasoning model" },
    ],
  },
  {
    id: "aihubmix",
    models: [
      { id: "gpt-4o", name: "GPT-4o", description: "Via AiHubMix" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Via AiHubMix" },
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", description: "Via AiHubMix" },
      { id: "claude-opus-4-20250514", name: "Claude Opus 4", description: "Via AiHubMix" },
      { id: "claude-haiku-4-20250514", name: "Claude Haiku 4", description: "Via AiHubMix" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Via AiHubMix" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Via AiHubMix" },
      { id: "deepseek-chat", name: "DeepSeek-V3", description: "Via AiHubMix" },
      { id: "deepseek-reasoner", name: "DeepSeek-R1", description: "Via AiHubMix" },
    ],
  },
  {
    id: "moonshot",
    models: [
      { id: "moonshot-v1-128k", name: "Moonshot v1 128k", description: "128k context window" },
      { id: "moonshot-v1-32k", name: "Moonshot v1 32k", description: "32k context window" },
      { id: "moonshot-v1-8k", name: "Moonshot v1 8k", description: "8k context window" },
    ],
  },
  {
    id: "cloudflare",
    models: [
      { id: "@cf/meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B", description: "Via Cloudflare Workers AI" },
      { id: "@cf/meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B", description: "Via Cloudflare Workers AI" },
      { id: "@cf/qwen/qwen2.5-72b-instruct", name: "Qwen 2.5 72B", description: "Via Cloudflare Workers AI" },
      { id: "@cf/deepseek-ai/deepseek-r1", name: "DeepSeek R1", description: "Via Cloudflare Workers AI" },
    ],
  },
];

/**
 * pi-ai KnownProvider list for reference.
 * These providers should use getModels() from pi-ai instead.
 */
export const KNOWN_PROVIDERS = [
  "amazon-bedrock",
  "anthropic",
  "google",
  "google-gemini-cli",
  "google-antigravity",
  "google-vertex",
  "openai",
  "azure-openai-responses",
  "openai-codex",
  "github-copilot",
  "xai",
  "groq",
  "cerebras",
  "openrouter",
  "vercel-ai-gateway",
  "zai",
  "mistral",
  "minimax",
  "minimax-cn",
  "huggingface",
  "opencode",
  "opencode-go",
  "kimi-coding",
] as const;

export type KnownProvider = (typeof KNOWN_PROVIDERS)[number];

/**
 * Check if a provider is a KnownProvider (has models in pi-ai)
 */
export function isKnownProvider(providerId: string): providerId is KnownProvider {
  return KNOWN_PROVIDERS.includes(providerId as KnownProvider);
}

/**
 * Get custom provider models (for non-KnownProviders)
 */
export function getCustomProviderModels(providerId: string): ProviderModel[] | undefined {
  return CUSTOM_PROVIDER_MODELS.find((p) => p.id === providerId)?.models;
}

/**
 * Check if a provider has custom models defined
 */
export function hasCustomProviderModels(providerId: string): boolean {
  return CUSTOM_PROVIDER_MODELS.some((p) => p.id === providerId);
}
