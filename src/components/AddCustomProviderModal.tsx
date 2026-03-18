import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../utils/cn";

export type ApiFormat = "openai-completions" | "anthropic-messages";

export interface AddCustomProviderForm {
  name: string;
  baseUrl: string;
  apiKey: string;
  apiFormat: ApiFormat;
  useMaxCompletionTokens: boolean;
}

const defaultForm: AddCustomProviderForm = {
  name: "",
  baseUrl: "",
  apiKey: "",
  apiFormat: "openai-completions",
  useMaxCompletionTokens: false,
};

interface AddCustomProviderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (form: AddCustomProviderForm) => void;
}

export function AddCustomProviderModal({
  open,
  onOpenChange,
  onAdd,
}: AddCustomProviderModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<AddCustomProviderForm>(defaultForm);

  const handleOpenChange = (next: boolean) => {
    if (!next) setForm(defaultForm);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(form);
    setForm(defaultForm);
    onOpenChange(false);
  };

  const labelClass = "block text-sm font-medium text-sidebar mb-1.5";
  const inputClass =
    "w-full rounded-lg border border-sidebar bg-transparent px-3 py-2 text-sidebar placeholder-sidebar-muted focus:outline-none focus:ring-1 ring-accent";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-sidebar bg-sidebar shadow-xl",
            "p-6 outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <Dialog.Title className="text-lg font-semibold text-sidebar mb-6">
            {t("addCustomProviderTitle")}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>
                {t("providerName")}
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder={t("addCustomProviderNamePlaceholder")}
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                {t("providerBaseUrl")}
              </label>
              <input
                type="url"
                className={inputClass}
                placeholder={t("addCustomProviderBaseUrlPlaceholder")}
                value={form.baseUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, baseUrl: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                {t("addCustomProviderApiKeyLabel")}
              </label>
              <input
                type="password"
                className={inputClass}
                placeholder={t("addCustomProviderApiKeyPlaceholder")}
                value={form.apiKey}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelClass}>
                {t("addCustomProviderApiFormat")}
              </label>
              <p className="text-xs text-sidebar-muted mb-2">
                {t("addCustomProviderApiFormatHint")}
              </p>
              <select
                className={inputClass}
                value={form.apiFormat}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    apiFormat: e.target.value as ApiFormat,
                  }))
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
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar">
                  {t("addCustomProviderMaxTokens")}
                </p>
                <p className="text-xs text-sidebar-muted mt-0.5">
                  {t("addCustomProviderMaxTokensHint")}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.useMaxCompletionTokens}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    useMaxCompletionTokens: !prev.useMaxCompletionTokens,
                  }))
                }
                className={cn(
                  "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                  form.useMaxCompletionTokens
                    ? "bg-accent"
                    : "bg-sidebar-muted/30"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-accent-foreground transition-[left]",
                    form.useMaxCompletionTokens ? "left-5" : "left-1"
                  )}
                />
              </button>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-sidebar bg-transparent px-4 py-2 text-sm text-sidebar hover:bg-sidebar-hover"
                >
                  {t("addCustomProviderCancel")}
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                {t("addCustomProviderAdd")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
