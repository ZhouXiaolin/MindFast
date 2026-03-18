import type { AppStorage } from "./storage";
import {
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  applyAppSettings,
  getAppSettingsSnapshot,
  selectAppSettings,
  useAppStore,
} from "./app";

const APP_SETTINGS_KEY = "app-settings";

type AppSettingsStorage = Pick<AppStorage, "settings">;

export async function loadAppSettings(storage: AppSettingsStorage): Promise<AppSettings> {
  const persisted = await storage.settings.get<Partial<AppSettings>>(APP_SETTINGS_KEY);
  return {
    ...DEFAULT_APP_SETTINGS,
    ...persisted,
  };
}

export async function hydrateAppSettings(storage: AppSettingsStorage): Promise<AppSettings> {
  const settings = await loadAppSettings(storage);
  applyAppSettings(settings);
  return settings;
}

export async function saveAppSettings(
  storage: AppSettingsStorage,
  settings: AppSettings
): Promise<void> {
  await storage.settings.set(APP_SETTINGS_KEY, settings);
}

export function subscribeAppSettingsPersistence(
  storage: AppSettingsStorage
): () => void {
  let lastSerialized = JSON.stringify(getAppSettingsSnapshot());

  return useAppStore.subscribe((state) => {
    if (!state.hydrated) {
      return;
    }

    const nextSettings = selectAppSettings(state);
    const nextSerialized = JSON.stringify(nextSettings);
    if (nextSerialized === lastSerialized) {
      return;
    }

    lastSerialized = nextSerialized;
    void saveAppSettings(storage, nextSettings).catch((error) => {
      console.error("Failed to persist app settings:", error);
    });
  });
}
