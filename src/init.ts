import { Agent } from "@mariozechner/pi-agent-core";
import { initStorage, type ExtendedAppStorage } from "./stores/init";
import { createAgent } from "./ai/agent";
import { ArtifactsStore } from "./ai/artifacts/store";

let storage: ExtendedAppStorage | null = null;
let agent: Agent | null = null;
let artifactsStore: ArtifactsStore | null = null;
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

/**
 * Get all enabled models from storage
 */
export async function getEnabledModels(): Promise<Array<{ providerId: string; modelId: string; name: string }>> {
  const s = storage;
  if (!s) return [];
  const { getEnabledModels: _getEnabledModels } = await import("./ai/agent");
  return _getEnabledModels(s);
}

/**
 * Get a model object for the given provider and model ID
 */
export async function getModelForProvider(providerId: string, modelId: string) {
  const { getModelForProvider: _getModelForProvider } = await import("./ai/agent");
  return _getModelForProvider(providerId, modelId);
}

/**
 * Re-export types
 */
export type { ExtendedAppStorage } from "./stores/init";
