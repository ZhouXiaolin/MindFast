import { useEffect, useState, useCallback, useRef } from "react";
import { initPi, getAppStorage } from "../pi/initPi";
import { setApiKeyPromptHandler } from "../pi/apiKeyPrompt";
import { NoModelConfigured } from "../components/NoModelConfigured";
import { ChatUI } from "../components/ChatUI";
import { ApiKeyPromptDialog } from "../components/ApiKeyPromptDialog";

export function ChatView() {
  const [hasConfig, setHasConfig] = useState<boolean | null>(null);
  const [apiKeyDialog, setApiKeyDialog] = useState<{ open: boolean; provider: string }>({
    open: false,
    provider: "",
  });
  const apiKeyResolveRef = useRef<((saved: boolean) => void) | null>(null);

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
        const enabledProviderIds = await storage.enabledProviders.getAll();
        let hasAnyEnabledModel = false;
        for (const providerId of enabledProviderIds) {
          const enabledModels = await storage.enabledModels.get(providerId);
          if (enabledModels && enabledModels.modelIds.length > 0) {
            hasAnyEnabledModel = true;
            break;
          }
        }
        if (!cancelled) setHasConfig(hasAnyEnabledModel);
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

  useEffect(() => {
    const handler = (provider: string) => {
      return new Promise<boolean>((resolve) => {
        apiKeyResolveRef.current = resolve;
        setApiKeyDialog({ open: true, provider });
      });
    };
    setApiKeyPromptHandler(handler);
    return () => setApiKeyPromptHandler(null);
  }, []);

  const handleApiKeyDialogResolve = useCallback((saved: boolean) => {
    apiKeyResolveRef.current?.(saved);
    apiKeyResolveRef.current = null;
    setApiKeyDialog((prev) => ({ ...prev, open: false }));
  }, []);

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

  return (
    <>
      <div className="flex h-full w-full flex-col" style={{ minHeight: 0 }}>
        <ChatUI />
      </div>
      <ApiKeyPromptDialog
        provider={apiKeyDialog.provider}
        open={apiKeyDialog.open}
        onOpenChange={(open) => !open && handleApiKeyDialogResolve(false)}
        onResolve={handleApiKeyDialogResolve}
      />
    </>
  );
}
