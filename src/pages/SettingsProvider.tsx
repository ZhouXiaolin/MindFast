import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { initPi, getAppStorage } from "../pi/initPi";
import type { CustomProvider, AutoDiscoveryProviderType } from "@mariozechner/pi-web-ui";
import { getModels } from "@mariozechner/pi-ai";
import {
  COMMON_PROVIDERS,
  isCommonProvider,
} from "../config/commonProviders";
import {
  isKnownProvider,
  getCustomProviderModels,
} from "../config/commonProviderModels";
import { AddCustomProviderModal, type AddCustomProviderForm } from "../components/AddCustomProviderModal";
import { cn } from "../lib/cn";

export type ProviderListItem =
  | { id: string; name: string; common: true; config: (typeof COMMON_PROVIDERS)[number] }
  | { id: string; name: string; common: false; provider: CustomProvider };

export interface ProviderModel {
  id: string;
  name: string;
  description?: string;
}

const inputClass =
  "w-full rounded-lg border border-sidebar bg-transparent px-3 py-2 text-sidebar placeholder-sidebar-muted focus:outline-none focus:ring-1 focus:ring-[var(--sidebar-border)]";

export function SettingsProvider() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);
  const [providerKeys, setProviderKeys] = useState<Record<string, string | null>>({});
  const [editedProviderKeys, setEditedProviderKeys] = useState<Record<string, string>>({});
  const [enabledProviders, setEnabledProviders] = useState<Set<string>>(new Set());
  const [providerModels, setProviderModels] = useState<Record<string, ProviderModel[]>>({});
  const [enabledModels, setEnabledModels] = useState<Record<string, Set<string>>>({});
  const [modelSearches, setModelSearches] = useState<Record<string, string>>({});
  const [fetchingModels, setFetchingModels] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [lastSaved, setLastSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edited custom provider data
  const [editedCustomProviders, setEditedCustomProviders] = useState<Record<string, {
    name: string;
    baseUrl: string;
    apiKey: string;
    apiFormat: "openai-completions" | "anthropic-messages";
  }>>({});

  const loadStorage = useCallback(async () => {
    await initPi();
    const storage = getAppStorage();
    if (!storage) return null;
    const custom = await storage.customProviders.getAll();
    setCustomProviders(custom);

    const keys: Record<string, string | null> = {};
    for (const p of COMMON_PROVIDERS) {
      const k = await storage.providerKeys.get(p.id);
      keys[p.id] = k ?? null;
    }
    setProviderKeys((prev) => ({ ...prev, ...keys }));

    // Load enabled providers
    const enabledData = await storage.enabledProviders.getAll();
    setEnabledProviders(new Set(enabledData));

    // Load models for each provider
    const models: Record<string, ProviderModel[]> = {};
    const enabledModelsData: Record<string, Set<string>> = {};

    for (const provider of [...COMMON_PROVIDERS, ...custom]) {
      const providerModels = await storage.models.get(provider.id);
      if (providerModels) {
        models[provider.id] = providerModels;
      }
      const enabled = await storage.enabledModels.get(provider.id);
      if (enabled) {
        enabledModelsData[provider.id] = new Set(enabled.modelIds);
      }
    }
    setProviderModels(models);
    setEnabledModels(enabledModelsData);

    return storage;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadStorage().then((storage) => {
      if (!cancelled && storage) setStorageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loadStorage]);

  const refreshProviders = useCallback(async () => {
    const storage = getAppStorage();
    if (!storage) return;
    const list = await storage.customProviders.getAll();
    setCustomProviders(list);
  }, []);

  const providerList: ProviderListItem[] = useMemo(() => {
    const common: ProviderListItem[] = COMMON_PROVIDERS.map((config) => ({
      id: config.id,
      name: t(config.nameKey),
      common: true as const,
      config,
    }));
    const custom: ProviderListItem[] = customProviders.map((p) => ({
      id: p.id,
      name: p.name,
      common: false as const,
      provider: p,
    }));
    const all = [...common, ...custom];
    if (!search.trim()) return all;
    const q = search.trim().toLowerCase();
    return all.filter((item) => item.name.toLowerCase().includes(q));
  }, [customProviders, search, t]);

  const selectedItem = selectedId
    ? providerList.find((p) => p.id === selectedId)
    : null;

  const handleAddProvider = useCallback(
    async (form: AddCustomProviderForm) => {
      const storage = getAppStorage();
      if (!storage) return;
      const provider: CustomProvider = {
        id: crypto.randomUUID(),
        name: form.name,
        type: form.apiFormat,
        baseUrl: form.baseUrl.replace(/\/$/, ""),
        apiKey: form.apiKey || undefined,
      };
      await storage.customProviders.set(provider);
      await refreshProviders();
      setSelectedId(provider.id);
    },
    [refreshProviders]
  );

  const handleSaveAll = useCallback(async () => {
    const storage = getAppStorage();
    if (!storage) return;
    setSaving(true);

    try {
      // Save all edited provider keys
      for (const [providerId, apiKey] of Object.entries(editedProviderKeys)) {
        await storage.providerKeys.set(providerId, apiKey || "");
        setProviderKeys((prev) => ({ ...prev, [providerId]: apiKey || null }));
      }

      // Save all edited custom providers
      for (const [id, updates] of Object.entries(editedCustomProviders)) {
        const existing = customProviders.find((p) => p.id === id);
        if (!existing) continue;
        const provider: CustomProvider = {
          ...existing,
          name: updates.name,
          type: updates.apiFormat,
          baseUrl: updates.baseUrl.replace(/\/$/, ""),
          apiKey: updates.apiKey || undefined,
        };
        await storage.customProviders.set(provider);
      }
      await refreshProviders();

      setEditedProviderKeys({});
      setEditedCustomProviders({});
      setLastSaved(true);
      setTimeout(() => setLastSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [editedProviderKeys, editedCustomProviders, customProviders, refreshProviders]);

  const handleApiKeyChange = useCallback((providerId: string, value: string) => {
    setEditedProviderKeys((prev) => ({ ...prev, [providerId]: value }));
  }, []);

  const handleCustomProviderChange = useCallback((id: string, field: string, value: string) => {
    setEditedCustomProviders((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {
          name: customProviders.find((p) => p.id === id)?.name || "",
          baseUrl: customProviders.find((p) => p.id === id)?.baseUrl || "",
          apiKey: customProviders.find((p) => p.id === id)?.apiKey || "",
          apiFormat: customProviders.find((p) => p.id === id)?.type || "openai-completions",
        }),
        [field]: value,
      },
    }));
  }, [customProviders]);

  const handleDeleteCustomProvider = useCallback(
    async (id: string) => {
      const storage = getAppStorage();
      if (!storage) return;
      await storage.customProviders.delete(id);
      if (selectedId === id) setSelectedId(null);
      await refreshProviders();
    },
    [selectedId, refreshProviders]
  );

  const handleToggleProvider = useCallback(async (providerId: string, enabled: boolean) => {
    const storage = getAppStorage();
    if (!storage) return;
    if (enabled) {
      await storage.enabledProviders.add(providerId);
      setEnabledProviders((prev) => new Set(prev).add(providerId));
    } else {
      await storage.enabledProviders.delete(providerId);
      setEnabledProviders((prev) => {
        const next = new Set(prev);
        next.delete(providerId);
        return next;
      });
    }
  }, []);

  const handleFetchModels = useCallback(async (providerId: string) => {
    const storage = getAppStorage();
    if (!storage) return;
    setFetchingModels((prev) => new Set(prev).add(providerId));

    try {
      let models: ProviderModel[] = [];

      // Check if it's a known provider
      if (isKnownProvider(providerId)) {
        // Use pi-ai's built-in models for KnownProviders
        const piModels = getModels(providerId);
        models = piModels.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.reasoning ? "Reasoning model" : undefined,
        }));
      } else {
        // Use custom models for non-KnownProviders (like deepseek, aihubmix, moonshot, cloudflare)
        const customModels = getCustomProviderModels(providerId);
        if (customModels) {
          models = customModels;
        } else {
          // Check if it's a custom provider with auto-discovery
          const customProvider = customProviders.find((p) => p.id === providerId);
          if (customProvider) {
            const autoDiscoveryType = customProvider.type as AutoDiscoveryProviderType;
            if (["ollama", "llama.cpp", "vllm", "lmstudio"].includes(autoDiscoveryType)) {
              // Auto-discovery is available but requires special import
              // For now, show a message to the user
              models = [{
                id: "auto-discovery",
                name: `Auto-discovery for ${autoDiscoveryType}`,
                description: "Models will be discovered when connected",
              }];
            } else {
              // For other custom providers, no models available
              models = [];
            }
          } else {
            // No models available for this provider
            console.warn(`No models available for provider: ${providerId}`);
            models = [];
          }
        }
      }

      await storage.models.set(providerId, models);
      setProviderModels((prev) => ({ ...prev, [providerId]: models }));
    } finally {
      setFetchingModels((prev) => {
        const next = new Set(prev);
        next.delete(providerId);
        return next;
      });
    }
  }, [customProviders]);

  const handleToggleModel = useCallback(async (providerId: string, modelId: string, enabled: boolean) => {
    const storage = getAppStorage();
    if (!storage) return;

    const currentEnabled = enabledModels[providerId] || new Set();
    const newEnabled = new Set(currentEnabled);

    if (enabled) {
      newEnabled.add(modelId);
    } else {
      newEnabled.delete(modelId);
    }

    setEnabledModels((prev) => ({ ...prev, [providerId]: newEnabled }));
    await storage.enabledModels.set(providerId, { modelIds: Array.from(newEnabled) });
  }, [enabledModels]);

  const handleModelSearchChange = useCallback((providerId: string, value: string) => {
    setModelSearches((prev) => ({ ...prev, [providerId]: value }));
  }, []);

  const hasKey = useCallback(
    (id: string) => {
      if (isCommonProvider(id)) {
        const editedKey = editedProviderKeys[id];
        if (editedKey !== undefined) return !!editedKey;
        return !!providerKeys[id];
      }
      const p = customProviders.find((c) => c.id === id);
      return !!(p?.apiKey?.trim());
    },
    [providerKeys, customProviders, editedProviderKeys]
  );

  const getEffectiveApiKey = useCallback((providerId: string) => {
    if (editedProviderKeys[providerId] !== undefined) {
      return editedProviderKeys[providerId];
    }
    return providerKeys[providerId] ?? "";
  }, [providerKeys, editedProviderKeys]);

  const getEditedCustomProvider = useCallback((id: string) => {
    if (editedCustomProviders[id]) {
      return editedCustomProviders[id];
    }
    const p = customProviders.find((c) => c.id === id);
    return p ? {
      name: p.name,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey ?? "",
      apiFormat: p.type as "openai-completions" | "anthropic-messages",
    } : null;
  }, [customProviders, editedCustomProviders]);

  const hasUnsavedChanges = Object.keys(editedProviderKeys).length > 0 ||
    Object.keys(editedCustomProviders).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Top: search + add custom provider button */}
      <div className="flex items-center justify-between">
        <div className="relative w-60 shrink-0">
          <input
            type="search"
            placeholder={t("settingsProviderSearchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
            aria-label={t("settingsProviderSearchPlaceholder")}
          />
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg border border-sidebar bg-sidebar-hover px-4 py-2 text-sm text-sidebar hover:opacity-90 shrink-0"
        >
          {t("settingsAddCustomProvider")}
        </button>
      </div>

      {/* Main content: provider list + detail */}
      <div className="flex gap-6 min-h-105 flex-1">
        {/* Left: provider list with icons */}
        <div className="settings-provider-divider flex w-60 shrink-0 flex-col pr-4">
          <nav className="flex flex-col gap-0.5 overflow-y-auto min-h-0">
            {!storageReady ? (
              <p className="text-sm text-sidebar-muted py-2">Loading…</p>
            ) : (
              providerList.map((item) => {
                const Icon = item.common ? item.config.Icon : null;
                const active = hasKey(item.id);
                const enabled = enabledProviders.has(item.id);
                const isEdited = editedProviderKeys[item.id] !== undefined ||
                  editedCustomProviders[item.id] !== undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors w-full",
                      selectedId === item.id
                        ? "bg-sidebar-hover text-sidebar"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                    )}
                  >
                    {Icon ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                        <Icon size={18} />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-sidebar-muted text-xs">
                        ?
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {isEdited && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                        title="Unsaved changes"
                        aria-hidden
                      />
                    )}
                    {!isEdited && enabled && (
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          active ? "bg-emerald-500" : "bg-emerald-500/60"
                        )}
                        title={t("providerActive")}
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* Right: detail or blank */}
        <div className="flex-1 min-w-0 flex flex-col">
          {!selectedItem ? (
            <p className="text-sm text-sidebar-muted">
              {t("settingsProviderDescription")}
            </p>
          ) : selectedItem.common ? (
            <CommonProviderPanel
              config={selectedItem.config}
              apiKey={getEffectiveApiKey(selectedItem.id)}
              enabled={enabledProviders.has(selectedItem.id)}
              models={providerModels[selectedItem.id] || []}
              enabledModels={enabledModels[selectedItem.id] || new Set()}
              modelSearch={modelSearches[selectedItem.id] || ""}
              fetchingModels={fetchingModels.has(selectedItem.id)}
              onApiKeyChange={(value) => handleApiKeyChange(selectedItem.id, value)}
              onToggleEnabled={(enabled) => handleToggleProvider(selectedItem.id, enabled)}
              onFetchModels={() => handleFetchModels(selectedItem.id)}
              onToggleModel={(modelId, enabled) => handleToggleModel(selectedItem.id, modelId, enabled)}
              onModelSearchChange={(value) => handleModelSearchChange(selectedItem.id, value)}
            />
          ) : (
            <CustomProviderPanel
              editedData={getEditedCustomProvider(selectedItem.id)}
              enabled={enabledProviders.has(selectedItem.id)}
              models={providerModels[selectedItem.id] || []}
              enabledModels={enabledModels[selectedItem.id] || new Set()}
              modelSearch={modelSearches[selectedItem.id] || ""}
              fetchingModels={fetchingModels.has(selectedItem.id)}
              onFieldChange={(field, value) => handleCustomProviderChange(selectedItem.id, field, value)}
              onDelete={() => handleDeleteCustomProvider(selectedItem.id)}
              onToggleEnabled={(enabled) => handleToggleProvider(selectedItem.id, enabled)}
              onFetchModels={() => handleFetchModels(selectedItem.id)}
              onToggleModel={(modelId, enabled) => handleToggleModel(selectedItem.id, modelId, enabled)}
              onModelSearchChange={(value) => handleModelSearchChange(selectedItem.id, value)}
            />
          )}
        </div>
      </div>

      {/* Global Save Button at bottom of settings page */}
      <div className="settings-provider-divider-t flex items-center justify-end gap-4 pt-4">
        <span className="text-sm text-sidebar-muted">
          {lastSaved ? t("providerAllChangesSaved") : hasUnsavedChanges ? "Unsaved changes" : "\u00A0"}
        </span>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving || !hasUnsavedChanges}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : t("providerSave")}
        </button>
      </div>

      <AddCustomProviderModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleAddProvider}
      />
    </div>
  );
}

const labelClass = "block text-sm font-medium text-sidebar mb-1.5";

// Toggle Switch Component
function Toggle({
  checked,
  onCheckedChange,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-emerald-500" : "bg-sidebar-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}

function CommonProviderPanel({
  config,
  apiKey,
  enabled,
  models,
  enabledModels,
  modelSearch,
  fetchingModels,
  onApiKeyChange,
  onToggleEnabled,
  onFetchModels,
  onToggleModel,
  onModelSearchChange,
}: {
  config: (typeof COMMON_PROVIDERS)[number];
  apiKey: string;
  enabled: boolean;
  models: ProviderModel[];
  enabledModels: Set<string>;
  modelSearch: string;
  fetchingModels: boolean;
  onApiKeyChange: (value: string) => void;
  onToggleEnabled: (enabled: boolean) => void;
  onFetchModels: () => void;
  onToggleModel: (modelId: string, enabled: boolean) => void;
  onModelSearchChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [showKey, setShowKey] = useState(false);

  const hasKey = !!apiKey.trim();
  const Icon = config.Icon;

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return models;
    const q = modelSearch.trim().toLowerCase();
    return models.filter((m) =>
      m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    );
  }, [models, modelSearch]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header with title and enable toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <Icon size={22} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-sidebar flex items-center gap-2">
              {t(config.nameKey)}
            </h2>
            <p className="text-sm text-sidebar-muted mt-0.5">
              {t(config.descriptionKey)}
            </p>
          </div>
        </div>
        <Toggle checked={enabled} onCheckedChange={onToggleEnabled} disabled={!hasKey} />
      </div>

      {/* API Key section */}
      <section>
        <label className={labelClass}>{t("providerApiKeyLabel")}</label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            className={inputClass + " pr-10"}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="••••••••"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-sidebar-muted hover:text-sidebar rounded"
            aria-label={showKey ? "Hide key" : "Show key"}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-sidebar-muted mt-1.5">
          {t("providerApiKeyGetFrom")}{" "}
          <a
            href={config.apiKeyLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            {t(config.nameKey)}
          </a>
        </p>
      </section>

      {/* Models section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-sidebar">{t("providerModels")}</h3>
          <button
            type="button"
            onClick={onFetchModels}
            disabled={fetchingModels}
            className="flex items-center gap-1.5 rounded-lg border border-sidebar bg-sidebar-hover px-3 py-1.5 text-sm text-sidebar hover:opacity-90 disabled:opacity-50"
          >
            {fetchingModels ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("providerFetchingModels")}
              </>
            ) : (
              t("providerFetchModels")
            )}
          </button>
        </div>

        {/* Model search */}
        {models.length > 0 && (
          <input
            type="search"
            placeholder={t("providerSearchModels")}
            value={modelSearch}
            onChange={(e) => onModelSearchChange(e.target.value)}
            className={inputClass}
          />
        )}

        {/* Models list */}
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {models.length === 0 ? (
            <p className="text-sm text-sidebar-muted py-2">
              {t("providerNoModelsYet")}
            </p>
          ) : filteredModels.length === 0 ? (
            <p className="text-sm text-sidebar-muted py-2">
              {t("providerNoModelsFound")}
            </p>
          ) : (
            filteredModels.map((model) => {
              const isEnabled = enabledModels.has(model.id);
              return (
                <div
                  key={model.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-hover/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sidebar">{model.name}</p>
                    {model.description && (
                      <p className="text-xs text-sidebar-muted truncate">{model.description}</p>
                    )}
                  </div>
                  <Toggle
                    checked={isEnabled}
                    onCheckedChange={(checked) => onToggleModel(model.id, checked)}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function CustomProviderPanel({
  editedData,
  enabled,
  models,
  enabledModels,
  modelSearch,
  fetchingModels,
  onFieldChange,
  onDelete,
  onToggleEnabled,
  onFetchModels,
  onToggleModel,
  onModelSearchChange,
}: {
  editedData: {
    name: string;
    baseUrl: string;
    apiKey: string;
    apiFormat: "openai-completions" | "anthropic-messages";
  } | null;
  enabled: boolean;
  models: ProviderModel[];
  enabledModels: Set<string>;
  modelSearch: string;
  fetchingModels: boolean;
  onFieldChange: (field: string, value: string) => void;
  onDelete: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onFetchModels: () => void;
  onToggleModel: (modelId: string, enabled: boolean) => void;
  onModelSearchChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  if (!editedData) return null;

  const { name, baseUrl, apiKey, apiFormat } = editedData;
  const hasKey = !!apiKey.trim();

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return models;
    const q = modelSearch.trim().toLowerCase();
    return models.filter((m) =>
      m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    );
  }, [models, modelSearch]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header with name and enable toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-sidebar">{name}</h2>
        <Toggle checked={enabled} onCheckedChange={onToggleEnabled} disabled={!hasKey} />
      </div>

      {/* Provider config fields */}
      <div>
        <label className={labelClass}>{t("providerName")}</label>
        <input
          type="text"
          className={inputClass}
          value={name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          placeholder={t("addCustomProviderNamePlaceholder")}
        />
      </div>
      <div>
        <label className={labelClass}>{t("providerBaseUrl")}</label>
        <input
          type="url"
          className={inputClass}
          value={baseUrl}
          onChange={(e) => onFieldChange("baseUrl", e.target.value)}
          placeholder={t("addCustomProviderBaseUrlPlaceholder")}
        />
      </div>
      <div>
        <label className={labelClass}>{t("addCustomProviderApiKeyLabel")}</label>
        <input
          type="password"
          className={inputClass}
          value={apiKey}
          onChange={(e) => onFieldChange("apiKey", e.target.value)}
          placeholder={t("addCustomProviderApiKeyPlaceholder")}
          autoComplete="off"
        />
      </div>
      <div>
        <label className={labelClass}>{t("addCustomProviderApiFormat")}</label>
        <select
          className={inputClass}
          value={apiFormat}
          onChange={(e) =>
            onFieldChange("apiFormat", e.target.value)
          }
        >
          <option value="openai-completions">
            {t("addCustomProviderApiFormatChat")}
          </option>
          <option value="anthropic-messages">
            {t("addCustomProviderApiFormatAnthropic")}
          </option>
        </select>
      </div>

      {/* Models section */}
      <section className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-sidebar">{t("providerModels")}</h3>
          <button
            type="button"
            onClick={onFetchModels}
            disabled={fetchingModels}
            className="flex items-center gap-1.5 rounded-lg border border-sidebar bg-sidebar-hover px-3 py-1.5 text-sm text-sidebar hover:opacity-90 disabled:opacity-50"
          >
            {fetchingModels ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("providerFetchingModels")}
              </>
            ) : (
              t("providerFetchModels")
            )}
          </button>
        </div>

        {/* Model search */}
        {models.length > 0 && (
          <input
            type="search"
            placeholder={t("providerSearchModels")}
            value={modelSearch}
            onChange={(e) => onModelSearchChange(e.target.value)}
            className={inputClass}
          />
        )}

        {/* Models list */}
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {models.length === 0 ? (
            <p className="text-sm text-sidebar-muted py-2">
              {t("providerNoModelsYet")}
            </p>
          ) : filteredModels.length === 0 ? (
            <p className="text-sm text-sidebar-muted py-2">
              {t("providerNoModelsFound")}
            </p>
          ) : (
            filteredModels.map((model) => {
              const isEnabled = enabledModels.has(model.id);
              return (
                <div
                  key={model.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-hover/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sidebar">{model.name}</p>
                    {model.description && (
                      <p className="text-xs text-sidebar-muted truncate">{model.description}</p>
                    )}
                  </div>
                  <Toggle
                    checked={isEnabled}
                    onCheckedChange={(checked) => onToggleModel(model.id, checked)}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Delete button only (save is global) */}
      <div className="settings-provider-divider-t flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-sidebar px-4 py-2 text-sm text-sidebar hover:bg-sidebar-hover"
        >
          {t("providerDelete")}
        </button>
      </div>
    </div>
  );
}
