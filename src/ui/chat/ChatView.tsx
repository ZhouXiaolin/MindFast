import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { initApp, getAppStorage } from "../../init";
import { setApiKeyPromptHandler } from "../../ai/api-key-prompt";
import { NoModelConfigured } from "../../components/NoModelConfigured";
import { ChatUI } from "./ChatUI";
import { ApiKeyPromptDialog } from "../../components/ApiKeyPromptDialog";

export function ChatView() {
  const { id: sessionId } = useParams<{ id: string }>();
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
        await initApp();
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

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        Loading…
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col" style={{ minHeight: 0 }}>
        <ChatUI sessionId={sessionId} />
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
