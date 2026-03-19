import {
  AppStorage,
  IndexedDBStorageBackend,
  ProviderKeysStore,
  SessionsStore,
  SettingsStore,
  CustomProvidersStore,
  setAppStorage,
} from "./storage";
import { EnabledProvidersStore, ModelsStore, EnabledModelsStore } from "./provider-stores";
import { SubtaskRunsStore } from "./storage/stores/subtask-runs-store";

const DB_NAME = "mindfast-pi";
const DB_VERSION = 3;

let storageInstance: ExtendedAppStorage | null = null;
let initPromise: Promise<ExtendedAppStorage> | null = null;

/**
 * Initialize storage backend and all stores
 */
export async function initStorage(): Promise<ExtendedAppStorage> {
  if (storageInstance) {
    return storageInstance;
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
    const subtaskRuns = new SubtaskRunsStore();

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
        subtaskRuns.getConfig(),
      ],
    });

    settings.setBackend(backend);
    providerKeys.setBackend(backend);
    sessions.setBackend(backend);
    customProviders.setBackend(backend);
    enabledProviders.setBackend(backend);
    models.setBackend(backend);
    enabledModels.setBackend(backend);
    subtaskRuns.setBackend(backend);

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
    extendedStorage.subtaskRuns = subtaskRuns;

    setAppStorage(appStorage);
    storageInstance = extendedStorage;

    return extendedStorage;
  })();

  return initPromise;
}

/**
 * Get the storage instance (must call initStorage() first)
 */
export function getStorageInstance(): AppStorage | null {
  return storageInstance;
}

/**
 * Extended AppStorage with additional provider/model stores
 */
export interface ExtendedAppStorage extends AppStorage {
  enabledProviders: EnabledProvidersStore;
  models: ModelsStore;
  enabledModels: EnabledModelsStore;
  subtaskRuns: SubtaskRunsStore;
}
