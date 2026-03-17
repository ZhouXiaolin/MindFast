import { Agent } from "@mariozechner/pi-agent-core";
import { getModel } from "@mariozechner/pi-ai";
import {
  AppStorage,
  ChatPanel,
  IndexedDBStorageBackend,
  ProviderKeysStore,
  SessionsStore,
  SettingsStore,
  CustomProvidersStore,
  setAppStorage,
  getAppStorage as piGetAppStorage,
  defaultConvertToLlm,
  ApiKeyPromptDialog,
} from "@mariozechner/pi-web-ui";
import { EnabledProvidersStore, ModelsStore, EnabledModelsStore } from "./stores";

const DB_NAME = "mindfast-pi";
const DB_VERSION = 2;

let storage: ExtendedAppStorage | null = null;
let agent: Agent | null = null;
let initPromise: Promise<{ storage: ExtendedAppStorage; agent: Agent }> | null = null;

export interface ExtendedAppStorage extends AppStorage {
  enabledProviders: EnabledProvidersStore;
  models: ModelsStore;
  enabledModels: EnabledModelsStore;
}

export async function initPi(): Promise<{ storage: ExtendedAppStorage; agent: Agent }> {
  if (storage && agent) {
    return { storage, agent };
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const settings = new SettingsStore();
    const providerKeys = new ProviderKeysStore();
    const sessions = new SessionsStore();
    const customProviders = new CustomProvidersStore();
    const enabledProviders = new EnabledProvidersStore();
    const models = new ModelsStore();
    const enabledModels = new EnabledModelsStore();

    const backend = new IndexedDBStorageBackend({
      dbName: DB_NAME,
      version: DB_VERSION,
      stores: [
        settings.getConfig(),
        providerKeys.getConfig(),
        sessions.getConfig(),
        SessionsStore.getMetadataConfig(),
        customProviders.getConfig(),
        enabledProviders.getConfig(),
        models.getConfig(),
        enabledModels.getConfig(),
      ],
    });

    settings.setBackend(backend);
    providerKeys.setBackend(backend);
    sessions.setBackend(backend);
    customProviders.setBackend(backend);
    enabledProviders.setBackend(backend);
    models.setBackend(backend);
    enabledModels.setBackend(backend);

    const appStorage = new AppStorage(
      settings,
      providerKeys,
      sessions,
      customProviders,
      backend
    );

    // Extend AppStorage with new stores
    const extendedStorage = appStorage as ExtendedAppStorage;
    extendedStorage.enabledProviders = enabledProviders;
    extendedStorage.models = models;
    extendedStorage.enabledModels = enabledModels;

    setAppStorage(appStorage);
    storage = extendedStorage;

    agent = new Agent({
      initialState: {
        systemPrompt: "You are a helpful assistant.",
        model: getModel("openai", "gpt-4o-mini"),
        thinkingLevel: "off",
        messages: [],
        tools: [],
      },
      convertToLlm: defaultConvertToLlm,
      getApiKey: async (provider: string) => {
        const s = getAppStorage();
        const key = s ? await s.providerKeys.get(provider) : undefined;
        return key ?? undefined;
      },
    });

    return { storage: extendedStorage, agent };
  })();

  return initPromise;
}

export function getAppStorage(): ExtendedAppStorage | null {
  return storage;
}

// Export the original getAppStorage for compatibility
export { piGetAppStorage };

export async function createChatPanel(): Promise<ChatPanel> {
  const { agent: a } = await initPi();
  const chatPanel = new ChatPanel();
  await chatPanel.setAgent(a!, {
    onApiKeyRequired: (provider) => ApiKeyPromptDialog.prompt(provider),
  });
  return chatPanel;
}
