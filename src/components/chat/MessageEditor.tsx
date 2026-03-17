import type { Model } from "@mariozechner/pi-ai";
import type { ThinkingLevel } from "@mariozechner/pi-agent-core";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Brain, Send, Sparkles, Square } from "lucide-react";
import { cn } from "../../lib/cn";

const THINKING_OPTIONS: { value: ThinkingLevel; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "minimal", label: "Minimal" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  isStreaming: boolean;
  currentModel?: Model<any>;
  thinkingLevel: ThinkingLevel;
  onThinkingChange?: (level: ThinkingLevel) => void;
  onSend: (input: string) => void;
  onAbort?: () => void;
  onModelSelect?: () => void;
  placeholder?: string;
}

export function MessageEditor({
  value,
  onChange,
  isStreaming,
  currentModel,
  thinkingLevel,
  onThinkingChange,
  onSend,
  onAbort,
  onModelSelect,
  placeholder = "Type a message…",
}: MessageEditorProps) {
  const supportsThinking = (currentModel as { reasoning?: boolean } | undefined)?.reasoning === true;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) {
        onSend(value.trim());
      }
    } else if (e.key === "Escape" && isStreaming) {
      e.preventDefault();
      onAbort?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStreaming && value.trim()) onSend(value.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-sidebar bg-sidebar shadow-sm",
        "focus-within:ring-1 focus-within:ring-accent"
      )}
    >
      <textarea
        className="w-full resize-none overflow-y-auto bg-transparent px-4 py-3 text-sidebar placeholder-sidebar-muted outline-none"
        placeholder={placeholder}
        rows={1}
        style={{ minHeight: "1.5rem", maxHeight: "200px" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <div className="flex items-center gap-1">
          {supportsThinking && onThinkingChange && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>{THINKING_OPTIONS.find((o) => o.value === thinkingLevel)?.label ?? "Off"}</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[120px] rounded-lg border border-sidebar bg-sidebar py-1 shadow-lg"
                  sideOffset={4}
                >
                  {THINKING_OPTIONS.map((opt) => (
                    <DropdownMenu.Item
                      key={opt.value}
                      className="cursor-pointer px-3 py-1.5 text-sm text-sidebar outline-none hover:bg-sidebar-hover data-[highlighted]:bg-sidebar-hover"
                      onSelect={() => onThinkingChange(opt.value)}
                    >
                      {opt.label}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentModel && onModelSelect && (
            <button
              type="button"
              onClick={() => {
                requestAnimationFrame(() => onModelSelect());
              }}
              className="flex items-center gap-1 truncate rounded-lg px-2 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar max-w-[140px]"
              title={currentModel.name}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{currentModel.id}</span>
            </button>
          )}
          {isStreaming ? (
            <button
              type="button"
              onClick={onAbort}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
              aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Send"
            >
              <span style={{ transform: "rotate(-45deg)" }}>
                <Send className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
