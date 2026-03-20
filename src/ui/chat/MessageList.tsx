import type { AgentMessage, AgentTool } from "@mariozechner/pi-agent-core";
import type { AssistantMessage as AssistantMessageType, ToolResultMessage } from "@mariozechner/pi-ai";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";

interface MessageListProps {
  messages: AgentMessage[];
  tools?: AgentTool[];
  pendingToolCalls?: Set<string>;
  isStreaming?: boolean;
  onOpenArtifact?: (filename: string) => void;
  onEditUserMessage?: (messageIndex: number, newContent: string) => void;
  onRetryUserMessage?: (messageIndex: number, content: string) => void;
}

export function MessageList({
  messages,
  tools = [],
  pendingToolCalls,
  isStreaming = false,
  onOpenArtifact,
  onEditUserMessage,
  onRetryUserMessage,
}: MessageListProps) {
  // 收集所有工具结果
  const toolResultsById = new Map<string, ToolResultMessage>();
  for (const m of messages) {
    if (m.role === "toolResult") {
      toolResultsById.set((m as ToolResultMessage & { toolCallId: string }).toolCallId, m as ToolResultMessage);
    }
  }

  const items: React.ReactNode[] = [];
  let index = 0;

  for (const [messageIndex, msg] of messages.entries()) {
    const role = (msg as { role: string }).role;
    if (role === "workspaceFile") continue;

    if (role === "user" || role === "user-with-attachments") {
      items.push(
        <UserMessage
          key={`msg-${index}`}
          message={msg as any}
          onEdit={(newContent) => onEditUserMessage?.(messageIndex, newContent)}
          onRetry={(content) => onRetryUserMessage?.(messageIndex, content)}
        />
      );
      index++;
    } else if (msg.role === "assistant") {
      items.push(
        <AssistantMessage
          key={`msg-${index}`}
          message={msg as AssistantMessageType}
          tools={tools}
          pendingToolCalls={pendingToolCalls}
          toolResultsById={toolResultsById}
          isStreaming={false}
          hidePendingToolCalls={isStreaming}
          onOpenArtifact={onOpenArtifact}
        />
      );
      index++;
    }
  }

  return <div className="flex flex-col gap-5">{items}</div>;
}
