import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "../../lib/cn";

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
            <div className="prose prose-sm dark:prose-invert mt-2 max-w-none break-words text-sidebar-muted">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : null}
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
