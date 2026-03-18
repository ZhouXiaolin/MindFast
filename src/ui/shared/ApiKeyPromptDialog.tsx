import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { getInitializedAppStorage } from "../../init";

interface ApiKeyPromptDialogProps {
  provider: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (saved: boolean) => void;
}

export function ApiKeyPromptDialog({
  provider,
  open,
  onOpenChange,
  onResolve,
}: ApiKeyPromptDialogProps) {
  const [key, setKey] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setKey("");

    const poll = async () => {
      if (cancelled) return;
      setChecking(true);
      try {
        const storage = await getInitializedAppStorage();
        const existing = await storage.providerKeys.get(provider);
        if (existing) {
          onResolve(true);
          onOpenChange(false);
          return;
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }

      if (!cancelled) {
        window.setTimeout(() => {
          void poll();
        }, 500);
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [open, provider, onResolve, onOpenChange]);

  const handleSave = async () => {
    if (!key.trim()) return;
    const storage = await getInitializedAppStorage();
    await storage.providerKeys.set(provider, key.trim());
    onResolve(true);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    onResolve(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(500px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-sidebar bg-sidebar p-6 shadow-xl"
          onPointerDownOutside={handleClose}
          onEscapeKeyDown={handleClose}
        >
          <Dialog.Title className="text-lg font-semibold text-sidebar">
            API Key Required
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-sidebar-muted">
            Provider: <span className="font-medium text-sidebar">{provider}</span>. Enter your API key below or add it in Settings.
          </Dialog.Description>
          <div className="mt-4">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="API key"
              className="w-full rounded-lg border border-sidebar bg-transparent px-3 py-2 text-sidebar placeholder-sidebar-muted focus:outline-none focus:ring-1 ring-accent"
              autoComplete="off"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-sidebar px-4 py-2 text-sm text-sidebar hover:bg-sidebar-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!key.trim() || checking}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
