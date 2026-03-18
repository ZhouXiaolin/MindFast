import { Agent } from "@mariozechner/pi-agent-core";
import { getModel } from "@mariozechner/pi-ai";
import type { Model } from "@mariozechner/pi-ai";
import type { ExtendedAppStorage } from "../stores/init";
import { defaultConvertToLlm } from "./convert";
import { getApiKeyPromptHandler } from "./api-key-prompt";
import { isKnownProvider, getCustomProviderModels } from "./providers";
import type { ArtifactsStore } from "./artifacts/store";
import { createArtifactsTool } from "./artifacts/tool";

const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant.

Answer directly in chat by default.
Use the artifacts tool only when the user explicitly asks you to create, save, update, or manage a file, or when the output is clearly a persistent deliverable such as markdown, html, json, csv, svg, or code the user should keep.
Do not create artifacts for greetings, simple questions, short explanations, brainstorming, or normal conversational replies.`;

/**
 * Provider base URLs for custom providers using openai-completions API
 */
const PROVIDER_BASE_URLS: Record<string, string> = {
  deepseek: "https://api.deepseek.com",
  aihubmix: "https://api.aihubmix.com/v1",
  moonshot: "https://api.moonshot.cn/v1",
  cloudflare: "https://api.cloudflare.com/client/v4",
};

/**
 * Provider model configurations
 */
const PROVIDER_MODEL_CONFIGS: Record<string, Record<string, { reasoning: boolean; contextWindow: number }>> = {
  deepseek: {
    "deepseek-chat": { reasoning: false, contextWindow: 65536 },
    "deepseek-reasoner": { reasoning: true, contextWindow: 65536 },
  },
  moonshot: {
    "moonshot-v1-128k": { reasoning: false, contextWindow: 128000 },
    "moonshot-v1-32k": { reasoning: false, contextWindow: 32000 },
    "moonshot-v1-8k": { reasoning: false, contextWindow: 8000 },
  },
};

/**
 * Create a custom model for providers using openai-completions API
 */
function createCustomModel(providerId: string, modelId: string, modelName: string): Model<"openai-completions"> {
  const baseUrl = PROVIDER_BASE_URLS[providerId] || "";
  const modelConfig = PROVIDER_MODEL_CONFIGS[providerId]?.[modelId] || { reasoning: false, contextWindow: 128000 };

  return {
    id: modelId,
    name: modelName,
    api: "openai-completions",
    provider: providerId,
    baseUrl: baseUrl,
    reasoning: modelConfig.reasoning,
    input: ["text"] as ("text" | "image")[],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: modelConfig.contextWindow,
    maxTokens: 8192,
  };
}

/**
 * Create an agent with the given storage and artifacts store
 */
export async function createAgent(
  storage: ExtendedAppStorage,
  artifactsStore: ArtifactsStore
): Promise<Agent> {
  // Try to get the first enabled model from user configuration
  let defaultModel: Model<any> = getModel("openai", "gpt-4o-mini"); // fallback

  try {
    const enabledProviderIds = await storage.enabledProviders.getAll();
    for (const providerId of enabledProviderIds) {
      const providerEnabledModels = await storage.enabledModels.get(providerId);
      if (providerEnabledModels && providerEnabledModels.modelIds.length > 0) {
        const modelId = providerEnabledModels.modelIds[0];

        // For known providers, use getModel from pi-ai
        if (isKnownProvider(providerId)) {
          try {
            defaultModel = getModel(providerId as any, modelId as any);
            break;
          } catch (e) {
            console.warn(`Failed to load model for ${providerId}:${modelId}, trying next provider`);
            continue;
          }
        } else {
          // For custom providers (deepseek, moonshot, etc.), create openai-completions model
          const customModels = getCustomProviderModels(providerId);
          const customModel = customModels?.find((m) => m.id === modelId);
          if (customModel) {
            defaultModel = createCustomModel(providerId, modelId, customModel.name);
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load user's default model, using fallback:", e);
  }

  const artifactsTool = createArtifactsTool(artifactsStore, () => agent);

  const agent = new Agent({
    initialState: {
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      model: defaultModel,
      thinkingLevel: "off",
      messages: [],
      tools: [artifactsTool],
    },
    convertToLlm: defaultConvertToLlm,
    getApiKey: async (provider: string) => {
      let key = await storage.providerKeys.get(provider);
      if (!key && getApiKeyPromptHandler()) {
        const ok = await getApiKeyPromptHandler()!(provider);
        if (ok) key = await storage.providerKeys.get(provider);
      }
      return key ?? undefined;
    },
  });

  return agent;
}

/**
 * Get all enabled models from storage
 */
export async function getEnabledModels(
  storage: ExtendedAppStorage
): Promise<Array<{ providerId: string; modelId: string; name: string }>> {
  const enabledProviderIds = await storage.enabledProviders.getAll();
  const allModels: Array<{ providerId: string; modelId: string; name: string }> = [];

  for (const providerId of enabledProviderIds) {
    const enabledModels = await storage.enabledModels.get(providerId);
    if (enabledModels && enabledModels.modelIds.length > 0) {
      const storedModels = await storage.models.get(providerId);

      for (const modelId of enabledModels.modelIds) {
        let modelName = modelId;

        // Get model name from stored models or pi-ai
        if (storedModels) {
          const stored = storedModels.find((m) => m.id === modelId);
          if (stored) modelName = stored.name;
        } else if (isKnownProvider(providerId)) {
          const { getModels } = await import("@mariozechner/pi-ai");
          const models = getModels(providerId as any);
          const model = models.find((m) => m.id === modelId);
          if (model) modelName = model.name;
        } else {
          const customModels = getCustomProviderModels(providerId);
          const model = customModels?.find((m) => m.id === modelId);
          if (model) modelName = model.name;
        }

        allModels.push({ providerId, modelId, name: modelName });
      }
    }
  }

  return allModels;
}

/**
 * Get a model object for the given provider and model ID
 */
export async function getModelForProvider(
  providerId: string,
  modelId: string
): Promise<Model<any>> {
  // For known providers, use pi-ai's getModel
  if (isKnownProvider(providerId)) {
    return getModel(providerId as any, modelId as any);
  }

  // For custom providers, create an openai-completions model
  const customModels = getCustomProviderModels(providerId);
  const customModel = customModels?.find((m) => m.id === modelId);
  if (customModel) {
    return createCustomModel(providerId, modelId, customModel.name);
  }

  // Fallback to openai
  return getModel("openai", "gpt-4o-mini");
}
