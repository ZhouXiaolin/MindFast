import { useEffect, useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Brain, Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { MarkdownContent } from "./MarkdownContent";

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
}

export function ThinkingBlock({ content, isStreaming = false }: ThinkingBlockProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStreaming) {
      setOpen(true);
    }
  }, [isStreaming]);

  return (
    <div
      className={cn(
        "thinking-block rounded-2xl border px-3 py-2 transition-colors",
        isStreaming
          ? "border-accent/30 bg-accent/10"
          : "border-sidebar-soft bg-sidebar-panel"
      )}
    >
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger
          className={cn(
            "flex w-full cursor-pointer select-none items-center justify-between gap-3 rounded-xl px-1 py-1 text-sm transition-colors",
            isStreaming ? "text-sidebar" : "text-sidebar-muted hover:text-sidebar",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <ChevronRight
              className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-90")}
              aria-hidden
            />
            {isStreaming ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
            ) : (
              <Brain className="h-4 w-4 shrink-0" />
            )}
            <div className="flex min-w-0 flex-col items-start">
              <span
                className={cn(
                  "truncate font-medium",
                  isStreaming &&
                    "animate-pulse bg-gradient-to-r from-accent via-[var(--sidebar-fg)] to-accent bg-[length:200%_100%] bg-clip-text text-transparent"
                )}
              >
                {isStreaming ? "Thinking in progress" : "Thought process"}
              </span>
              <span className="text-xs text-sidebar-muted">
                {isStreaming ? "The model is still reasoning" : "Reasoning complete"}
              </span>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em]",
              isStreaming
                ? "border-accent/30 bg-accent/10 text-accent-muted"
                : "border-sidebar-soft bg-sidebar-hover text-sidebar-muted"
            )}
          >
            {isStreaming ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            {isStreaming ? "Live" : "Done"}
          </span>
        </Collapsible.Trigger>
        <Collapsible.Content>
          {open && content.trim() ? (
            <MarkdownContent content={content} tone="muted" className="mt-3 border-t border-sidebar-soft pt-3" />
          ) : null}
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
