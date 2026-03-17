import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { MarkdownContent } from "./MarkdownContent";

type UserMessageLike = AgentMessage | {
  role: "user-with-attachments";
  content: unknown;
};

interface UserMessageProps {
  message: UserMessageLike;
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

export function UserMessage({ message }: UserMessageProps) {
  const content = extractUserTextContent(message.content);

  return (
    <div className="flex justify-start">
      <div className="user-message-container max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sidebar">
        <MarkdownContent content={content} className="text-[0.95rem]" />
      </div>
    </div>
  );
}
