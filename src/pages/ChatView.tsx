import { useEffect, useRef, useState } from "react";
import { createChatPanel, getAppStorage, initPi } from "../pi/initPi";
import type { ChatPanel } from "@mariozechner/pi-web-ui";
import { NoModelConfigured } from "../components/NoModelConfigured";

export function ChatView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasConfig, setHasConfig] = useState<boolean | null>(null);
  const panelRef = useRef<ChatPanel | null>(null);

  // Check if user has configured any models
  useEffect(() => {
    let cancelled = false;

    const checkModelConfig = async () => {
      try {
        await initPi();
        const storage = getAppStorage();
        if (!storage) {
          if (!cancelled) setHasConfig(false);
          return;
        }

        // Get enabled providers
        const enabledProviderIds = await storage.enabledProviders.getAll();

        // Check if any enabled providers have enabled models
        let hasAnyEnabledModel = false;

        for (const providerId of enabledProviderIds) {
          const enabledModels = await storage.enabledModels.get(providerId);
          if (enabledModels && enabledModels.modelIds.length > 0) {
            hasAnyEnabledModel = true;
            break;
          }
        }

        if (!cancelled) {
          setHasConfig(hasAnyEnabledModel);
        }
      } catch (err) {
        console.error("Failed to check model config:", err);
        if (!cancelled) setHasConfig(false);
      }
    };

    checkModelConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize chat panel when we have config
  useEffect(() => {
    if (hasConfig !== true) return;

    let mounted = true;
    const el = containerRef.current;
    if (!el) return;

    createChatPanel()
      .then((chatPanel) => {
        if (!mounted || !containerRef.current) return;
        panelRef.current = chatPanel;
        el.appendChild(chatPanel);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      mounted = false;
      if (panelRef.current && el.contains(panelRef.current)) {
        el.removeChild(panelRef.current);
        panelRef.current = null;
      }
    };
  }, [hasConfig]);

  if (hasConfig === null) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        Loading…
      </div>
    );
  }

  if (hasConfig === false) {
    return <NoModelConfigured />;
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col"
      style={{ minHeight: 0 }}
    />
  );
}
