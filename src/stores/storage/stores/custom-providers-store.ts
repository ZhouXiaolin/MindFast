import type { Model } from "@mariozechner/pi-ai";
import { Store } from "../store";
import type { StoreConfig } from "../types";

export type AutoDiscoveryProviderType = "ollama" | "llama.cpp" | "vllm" | "lmstudio";

export type CustomProviderType =
	| AutoDiscoveryProviderType
	| "openai-completions"
	| "openai-responses"
	| "anthropic-messages";

export interface CustomProvider {
	id: string;
	name: string;
	type: CustomProviderType;
	baseUrl: string;
	apiKey?: string;
	models?: Model<any>[];
}

export class CustomProvidersStore extends Store {
	getConfig(): StoreConfig {
		return { name: "custom-providers" };
	}

	async get(id: string): Promise<CustomProvider | null> {
		return this.getBackend().get<CustomProvider>("custom-providers", id);
	}

	async set(provider: CustomProvider): Promise<void> {
		await this.getBackend().set("custom-providers", provider.id, provider);
	}

	async delete(id: string): Promise<void> {
		await this.getBackend().delete("custom-providers", id);
	}

	async getAll(): Promise<CustomProvider[]> {
		const keys = await this.getBackend().keys("custom-providers");
		const providers: CustomProvider[] = [];
		for (const key of keys) {
			const provider = await this.get(key);
			if (provider) providers.push(provider);
		}
		return providers;
	}

	async has(id: string): Promise<boolean> {
		return this.getBackend().has("custom-providers", id);
	}
}
