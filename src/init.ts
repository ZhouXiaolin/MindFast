import { Agent } from "@mariozechner/pi-agent-core";
import { initStorage, type ExtendedAppStorage } from "./stores/init";
import {
  createAgent,
  getEnabledModels as getEnabledModelsFromStorage,
  getModelForProvider as getModelForProviderFromAgent,
} from "./ai/agent";
import { ArtifactsStore } from "./ai/artifacts/store";
import {
  hydrateAppSettings,
  subscribeAppSettingsPersistence,
} from "./stores/app-settings";

let storage: ExtendedAppStorage | null = null;
let agent: Agent | null = null;
let artifactsStore: ArtifactsStore | null = null;
let appSettingsPersistenceCleanup: (() => void) | null = null;
let initPromise: Promise<{ storage: ExtendedAppStorage; agent: Agent; artifactsStore: ArtifactsStore }> | null = null;

/**
 * Initialize the application: storage, agent, and artifacts store
 */
export async function initApp(): Promise<{
  storage: ExtendedAppStorage;
  agent: Agent;
  artifactsStore: ArtifactsStore;
}> {
  if (storage && agent && artifactsStore) {
    return { storage, agent, artifactsStore };
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    // Initialize storage
    const appStorage = await initStorage();
    storage = appStorage;
    await hydrateAppSettings(appStorage);
    if (!appSettingsPersistenceCleanup) {
      appSettingsPersistenceCleanup = subscribeAppSettingsPersistence(appStorage);
    }

    // Initialize artifacts store
    const store = new ArtifactsStore();
    artifactsStore = store;

    // Initialize agent
    agent = await createAgent(appStorage, store);

    return { storage: appStorage, agent, artifactsStore: store };
  })();

  return initPromise;
}

/**
 * Alias for initApp() for backward compatibility
 */
export { initApp as initPi };

/**
 * Get the app storage instance
 */
export function getAppStorage(): ExtendedAppStorage | null {
  return storage;
}

/**
 * Get the artifacts store instance
 */
export function getArtifactsStore(): ArtifactsStore | null {
  return artifactsStore;
}

export async function getInitializedAppStorage(): Promise<ExtendedAppStorage> {
  const { storage: appStorage } = await initApp();
  return appStorage;
}

/**
 * Get all enabled models from storage
 */
export async function getEnabledModels(): Promise<Array<{ providerId: string; modelId: string; name: string }>> {
  const appStorage = await getInitializedAppStorage();
  return getEnabledModelsFromStorage(appStorage);
}

/**
 * Get a model object for the given provider and model ID
 */
export async function getModelForProvider(providerId: string, modelId: string) {
  return getModelForProviderFromAgent(providerId, modelId);
}

/**
 * Re-export types
 */
export type { ExtendedAppStorage } from "./stores/init";
