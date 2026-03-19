import { useState, useRef, useEffect } from "react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { Check, PencilLine, RotateCcw, X } from "lucide-react";
import { MarkdownContent } from "./MarkdownContent";

type UserMessageLike = AgentMessage | {
  role: "user-with-attachments";
  content: unknown;
};

interface UserMessageProps {
  message: UserMessageLike;
  onEdit?: (newContent: string) => void;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(content);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(content.length, content.length);
      });
    }
  }, [isEditing, content]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== content) {
      onEdit?.(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(content);
    setIsEditing(false);
  };

  if (isEditing && hasContent) {
    return (
      <div className="user-message-flow flex flex-col items-end gap-2">
        <div className="flex w-full max-w-[min(92%,42rem)] flex-col gap-2 rounded-lg border border-sidebar-soft bg-sidebar-panel p-2">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                handleCancel();
              }
            }}
            className="min-h-16 w-full resize-y rounded border-0 bg-transparent px-2 py-1.5 text-[0.95rem] text-sidebar focus:outline-none focus:ring-0"
            rows={3}
          />
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 rounded-full bg-sidebar-panel px-2.5 py-1 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-full bg-sidebar-panel px-2.5 py-1 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-message-flow flex flex-col items-end gap-2">
      <div className="max-w-[min(92%,42rem)] px-1 text-right text-sidebar">
        <MarkdownContent content={content} className="text-[0.95rem]" />
      </div>
      {hasContent ? (
        <div className="flex items-center gap-2 pr-1 text-xs text-sidebar-muted">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
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
