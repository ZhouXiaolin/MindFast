import type { Model } from "@mariozechner/pi-ai";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";
import type { EnabledModelOption } from "./useChatModelMenu";

interface ChatModelPickerProps {
  currentModel: Model<any> | null;
  enabledModels: EnabledModelOption[];
  isLoadingModels: boolean;
  modelMenuOpen: boolean;
  modelMenuRef: React.RefObject<HTMLDivElement | null>;
  onSelectModelOption: (providerId: string, modelId: string) => void;
  onToggleMenu: () => void;
}

export function ChatModelPicker({
  currentModel,
  enabledModels,
  isLoadingModels,
  modelMenuOpen,
  modelMenuRef,
  onSelectModelOption,
  onToggleMenu,
}: ChatModelPickerProps) {
  return (
    <div ref={modelMenuRef} className="relative">
      <button
        type="button"
        onClick={onToggleMenu}
        className="inline-flex max-w-[min(26rem,72vw)] items-center gap-2 rounded-full bg-sidebar-panel px-3 py-1.5 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar"
        title={currentModel?.id ?? "No model"}
        aria-expanded={modelMenuOpen}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{currentModel?.id ?? "No model"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", modelMenuOpen && "rotate-180")} />
      </button>
      {modelMenuOpen ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(30rem,80vw)] overflow-hidden rounded-2xl border border-sidebar-soft bg-sidebar-panel-strong shadow-xl backdrop-blur-xl">
          <div className="border-b border-sidebar-soft px-3 py-2 text-xs uppercase tracking-[0.14em] text-sidebar-muted">
            Select model
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {isLoadingModels ? (
              <div className="px-3 py-3 text-sm text-sidebar-muted">Loading models…</div>
            ) : enabledModels.length === 0 ? (
              <div className="px-3 py-3 text-sm text-sidebar-muted">No enabled models</div>
            ) : (
              enabledModels.map((modelOption) => {
                const isCurrent =
                  currentModel?.provider === modelOption.providerId &&
                  currentModel?.id === modelOption.modelId;

                return (
                  <button
                    key={`${modelOption.providerId}:${modelOption.modelId}`}
                    type="button"
                    onClick={() => onSelectModelOption(modelOption.providerId, modelOption.modelId)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      isCurrent
                        ? "bg-accent/10 text-sidebar"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{modelOption.modelId}</div>
                      <div className="mt-0.5 text-xs text-sidebar-muted">{modelOption.providerId}</div>
                    </div>
                    {isCurrent ? <Check className="h-4 w-4 shrink-0 text-accent" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
