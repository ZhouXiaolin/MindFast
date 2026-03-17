import type { AgentMessage, AgentTool } from "@mariozechner/pi-agent-core";
import type { AssistantMessage as AssistantMessageType, ToolResultMessage } from "@mariozechner/pi-ai";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";

interface MessageListProps {
  messages: AgentMessage[];
  tools?: AgentTool[];
  pendingToolCalls?: Set<string>;
  isStreaming?: boolean;
  onCostClick?: () => void;
  onOpenArtifact?: (filename: string) => void;
}

export function MessageList({
  messages,
  tools = [],
  pendingToolCalls,
  isStreaming = false,
  onCostClick,
  onOpenArtifact,
}: MessageListProps) {
  const toolResultsById = new Map<string, ToolResultMessage>();
  for (const m of messages) {
    if (m.role === "toolResult") {
      const tr = m as ToolResultMessage & { toolCallId: string };
      toolResultsById.set(tr.toolCallId, m as ToolResultMessage);
    }
  }

  const items: React.ReactNode[] = [];
  let index = 0;

  for (const msg of messages) {
    const role = (msg as { role: string }).role;
    if (role === "artifact") continue;

    if (role === "user" || role === "user-with-attachments") {
      items.push(<UserMessage key={`msg-${index}`} message={msg as any} />);
      index++;
    } else if (msg.role === "assistant") {
      const amsg = msg as AssistantMessageType;
      items.push(
        <AssistantMessage
          key={`msg-${index}`}
          message={amsg}
          tools={tools}
          pendingToolCalls={pendingToolCalls}
          toolResultsById={toolResultsById}
          isStreaming={false}
          hidePendingToolCalls={isStreaming}
          onCostClick={onCostClick}
          onOpenArtifact={onOpenArtifact}
        />
      );
      index++;
    }
  }

  return <div className="flex flex-col gap-3">{items}</div>;
}
