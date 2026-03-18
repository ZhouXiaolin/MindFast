import {
  DeepSeek,
  OpenAI,
  Anthropic,
  Gemini,
  AiHubMix,
  Moonshot,
  OpenRouter,
  Azure,
  GithubCopilot,
  Cloudflare,
  ZAI,
  Codex,
} from "@lobehub/icons";

export interface CommonProviderConfig {
  id: string;
  nameKey: string;
  descriptionKey: string;
  apiKeyLinkUrl: string;
  Icon: React.ComponentType<{ size?: number }>;
}

export const COMMON_PROVIDERS: CommonProviderConfig[] = [
  {
    id: "deepseek",
    nameKey: "providerDeepSeek",
    descriptionKey: "providerDeepSeekDesc",
    apiKeyLinkUrl: "https://platform.deepseek.com",
    Icon: DeepSeek,
  },
  {
    id: "openai",
    nameKey: "providerOpenAI",
    descriptionKey: "providerOpenAIDesc",
    apiKeyLinkUrl: "https://platform.openai.com/api-keys",
    Icon: OpenAI,
  },
  {
    id: "anthropic",
    nameKey: "providerAnthropic",
    descriptionKey: "providerAnthropicDesc",
    apiKeyLinkUrl: "https://console.anthropic.com/settings/keys",
    Icon: Anthropic,
  },
  {
    id: "google",
    nameKey: "providerGoogleGemini",
    descriptionKey: "providerGoogleGeminiDesc",
    apiKeyLinkUrl: "https://aistudio.google.com/app/apikey",
    Icon: Gemini,
  },
  {
    id: "aihubmix",
    nameKey: "providerAiHubMix",
    descriptionKey: "providerAiHubMixDesc",
    apiKeyLinkUrl: "https://aihubmix.com",
    Icon: AiHubMix,
  },
  {
    id: "moonshot",
    nameKey: "providerMoonshot",
    descriptionKey: "providerMoonshotDesc",
    apiKeyLinkUrl: "https://platform.moonshot.cn/console/api/keys",
    Icon: Moonshot,
  },
  {
    id: "openrouter",
    nameKey: "providerOpenRouter",
    descriptionKey: "providerOpenRouterDesc",
    apiKeyLinkUrl: "https://openrouter.ai/keys",
    Icon: OpenRouter,
  },
  {
    id: "azure-openai-responses",
    nameKey: "providerAzureOpenAI",
    descriptionKey: "providerAzureOpenAIDesc",
    apiKeyLinkUrl: "https://portal.azure.com",
    Icon: Azure,
  },
  {
    id: "github-copilot",
    nameKey: "providerGitHubCopilot",
    descriptionKey: "providerGitHubCopilotDesc",
    apiKeyLinkUrl: "https://github.com/settings/copilot",
    Icon: GithubCopilot,
  },
  {
    id: "cloudflare",
    nameKey: "providerCloudflare",
    descriptionKey: "providerCloudflareDesc",
    apiKeyLinkUrl: "https://dash.cloudflare.com",
    Icon: Cloudflare,
  },
  {
    id: "zai",
    nameKey: "providerZAI",
    descriptionKey: "providerZAIDesc",
    apiKeyLinkUrl: "https://z.ai",
    Icon: ZAI,
  },
  {
    id: "openai-codex",
    nameKey: "providerCodex",
    descriptionKey: "providerCodexDesc",
    apiKeyLinkUrl: "https://platform.openai.com",
    Icon: Codex,
  },
];

export const COMMON_PROVIDER_IDS = new Set(COMMON_PROVIDERS.map((p) => p.id));

export function getCommonProvider(id: string): CommonProviderConfig | undefined {
  return COMMON_PROVIDERS.find((p) => p.id === id);
}

export function isCommonProvider(id: string): boolean {
  return COMMON_PROVIDER_IDS.has(id);
}
