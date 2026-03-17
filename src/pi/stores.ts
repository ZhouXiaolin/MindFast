import { Store } from "@mariozechner/pi-web-ui";

export interface EnabledModels {
  modelIds: string[];
}

/**
 * Store for enabled provider IDs.
 * Stores all enabled provider IDs in a single entry with key "all".
 */
export class EnabledProvidersStore extends Store {
  private static readonly ALL_KEY = "all";

  getConfig() {
    return {
      name: "enabled-providers",
    };
  }

  async getAll(): Promise<string[]> {
    const result = await this.getBackend().get<string[]>("enabled-providers", EnabledProvidersStore.ALL_KEY);
    return result ?? [];
  }

  async add(providerId: string): Promise<void> {
    const current = await this.getAll();
    if (!current.includes(providerId)) {
      current.push(providerId);
      await this.getBackend().set("enabled-providers", EnabledProvidersStore.ALL_KEY, current);
    }
  }

  async delete(providerId: string): Promise<void> {
    const current = await this.getAll();
    const filtered = current.filter((id) => id !== providerId);
    await this.getBackend().set("enabled-providers", EnabledProvidersStore.ALL_KEY, filtered);
  }

  async has(providerId: string): Promise<boolean> {
    const current = await this.getAll();
    return current.includes(providerId);
  }
}

/**
 * Store for provider models.
 */
export class ModelsStore extends Store {
  getConfig() {
    return {
      name: "models",
    };
  }

  async get(providerId: string): Promise<ProviderModel[] | undefined> {
    const result = await this.getBackend().get<ProviderModel[]>("models", providerId);
    return result ?? undefined;
  }

  async set(providerId: string, models: ProviderModel[]): Promise<void> {
    await this.getBackend().set("models", providerId, models);
  }

  async delete(providerId: string): Promise<void> {
    await this.getBackend().delete("models", providerId);
  }
}

export interface ProviderModel {
  id: string;
  name: string;
  description?: string;
}

/**
 * Store for enabled model IDs per provider.
 */
export class EnabledModelsStore extends Store {
  getConfig() {
    return {
      name: "enabled-models",
    };
  }

  async get(providerId: string): Promise<EnabledModels | undefined> {
    const result = await this.getBackend().get<EnabledModels>("enabled-models", providerId);
    return result ?? undefined;
  }

  async set(providerId: string, data: EnabledModels): Promise<void> {
    await this.getBackend().set("enabled-models", providerId, data);
  }

  async delete(providerId: string): Promise<void> {
    await this.getBackend().delete("enabled-models", providerId);
  }
}
