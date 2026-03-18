import type { CustomProvidersStore } from "./stores/custom-providers-store";
import type { ProviderKeysStore } from "./stores/provider-keys-store";
import type { SessionsStore } from "./stores/sessions-store";
import type { SettingsStore } from "./stores/settings-store";
import type { StorageBackend } from "./types";

export class AppStorage {
	readonly backend: StorageBackend;
	readonly settings: SettingsStore;
	readonly providerKeys: ProviderKeysStore;
	readonly sessions: SessionsStore;
	readonly customProviders: CustomProvidersStore;

	constructor(
		settings: SettingsStore,
		providerKeys: ProviderKeysStore,
		sessions: SessionsStore,
		customProviders: CustomProvidersStore,
		backend: StorageBackend
	) {
		this.settings = settings;
		this.providerKeys = providerKeys;
		this.sessions = sessions;
		this.customProviders = customProviders;
		this.backend = backend;
	}

	async getQuotaInfo(): Promise<{ usage: number; quota: number; percent: number }> {
		return this.backend.getQuotaInfo();
	}

	async requestPersistence(): Promise<boolean> {
		return this.backend.requestPersistence();
	}
}

let globalAppStorage: AppStorage | null = null;

export function getAppStorage(): AppStorage {
	if (!globalAppStorage) {
		throw new Error("AppStorage not initialized. Call setAppStorage() first.");
	}
	return globalAppStorage;
}

export function setAppStorage(storage: AppStorage): void {
	globalAppStorage = storage;
}
