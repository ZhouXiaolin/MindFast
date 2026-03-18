import type { Model } from "@mariozechner/pi-ai";
import type { ThinkingLevel } from "@mariozechner/pi-agent-core";
import { useLayoutEffect, useRef, type RefObject } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Brain, Send, Square } from "lucide-react";
import { cn } from "../../utils/cn";

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
  placeholder?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
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
  placeholder = "Type a message…",
  textareaRef,
}: MessageEditorProps) {
  const supportsThinking = (currentModel as { reasoning?: boolean } | undefined)?.reasoning === true;
  const localTextareaRef = useRef<HTMLTextAreaElement>(null);
  const resolvedTextareaRef = textareaRef ?? localTextareaRef;

  useLayoutEffect(() => {
    const textarea = resolvedTextareaRef.current;
    if (!textarea) return;

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 28;
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;
    const minHeight = lineHeight * 3 + paddingTop + paddingBottom + borderTop + borderBottom;
    const maxHeight = lineHeight * 5 + paddingTop + paddingBottom + borderTop + borderBottom;

    textarea.style.height = "auto";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [resolvedTextareaRef, value]);

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
        "chat-composer-frame rounded-[1.5rem]",
        "focus-within:ring-1 focus-within:ring-accent"
      )}
    >
      <div className="flex items-end gap-3 px-3 pt-3">
        <textarea
          ref={resolvedTextareaRef}
          className="flex-1 resize-none overflow-y-auto bg-transparent px-2 pt-1 pb-2 text-[0.95rem] leading-7 text-sidebar placeholder-sidebar-muted outline-none"
          placeholder={placeholder}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
        />
        <div className="flex shrink-0 items-center pb-2">
          {isStreaming ? (
            <button
              type="button"
              onClick={onAbort}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-semantic-error/30 bg-semantic-error/10 text-semantic-error transition-opacity hover:opacity-90"
              aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex h-10 min-w-10 items-center justify-center rounded-full bg-accent px-3 text-accent-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-45"
              aria-label="Send"
            >
              <span style={{ transform: "rotate(-45deg)" }}>
                <Send className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-sidebar-soft px-3 pt-2 pb-3">
        <div className="flex items-center gap-1">
          {supportsThinking && onThinkingChange && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full bg-sidebar-panel px-3 py-1.5 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar"
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>{THINKING_OPTIONS.find((o) => o.value === thinkingLevel)?.label ?? "Off"}</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[120px] rounded-2xl border border-sidebar-soft bg-sidebar-panel-strong py-1 shadow-lg"
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
      </div>
    </form>
  );
}
