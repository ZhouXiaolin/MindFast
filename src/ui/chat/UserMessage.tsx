import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { PencilLine, RotateCcw } from "lucide-react";
import { MarkdownContent } from "./MarkdownContent";

type UserMessageLike = AgentMessage | {
  role: "user-with-attachments";
  content: unknown;
};

interface UserMessageProps {
  message: UserMessageLike;
  onEdit?: (content: string) => void;
  onRetry?: (content: string) => void;
}

function extractUserTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .flatMap((block) => {
        if (
          typeof block === "object" &&
          block !== null &&
          "type" in block &&
          (block as { type?: string }).type === "text" &&
          "text" in block &&
          typeof (block as { text?: unknown }).text === "string"
        ) {
          return [(block as { text: string }).text];
        }
        return [];
      })
      .join("\n\n");
  }

  return "";
}

export function UserMessage({ message, onEdit, onRetry }: UserMessageProps) {
  const content = extractUserTextContent(message.content);
  const hasContent = content.trim().length > 0;

  return (
    <div className="user-message-flow flex flex-col items-end gap-2">
      <div className="max-w-[min(92%,42rem)] px-1 text-right text-sidebar">
        <MarkdownContent content={content} className="text-[0.95rem]" />
      </div>
      {hasContent ? (
        <div className="flex items-center gap-2 pr-1 text-xs text-sidebar-muted">
          <button
            type="button"
            onClick={() => onEdit?.(content)}
            className="inline-flex items-center gap-1 rounded-full bg-sidebar-panel px-2.5 py-1 transition-colors hover:bg-sidebar-hover hover:text-sidebar"
          >
            <PencilLine className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onRetry?.(content)}
            className="inline-flex items-center gap-1 rounded-full bg-sidebar-panel px-2.5 py-1 transition-colors hover:bg-sidebar-hover hover:text-sidebar"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
