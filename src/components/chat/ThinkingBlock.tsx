import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { MarkdownContent } from "./MarkdownContent";

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
}

export function ThinkingBlock({ content, isStreaming = false }: ThinkingBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="thinking-block">
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger
          className={cn(
            "flex w-full cursor-pointer select-none items-center gap-2 py-1 text-sm text-sidebar-muted transition-colors hover:text-sidebar",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded"
          )}
        >
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-90")}
            aria-hidden
          />
          <span
            className={cn(
              isStreaming &&
                "animate-pulse bg-gradient-to-r from-sidebar-muted via-sidebar to-sidebar-muted bg-[length:200%_100%] bg-clip-text text-transparent"
            )}
          >
            Thinking…
          </span>
        </Collapsible.Trigger>
        <Collapsible.Content>
          {open && content.trim() ? (
            <MarkdownContent content={content} tone="muted" className="mt-2" />
          ) : null}
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
