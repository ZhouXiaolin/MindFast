import type { AgentMessage, AgentTool } from "@mariozechner/pi-agent-core";
import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { AssistantMessage } from "./AssistantMessage";

interface StreamingMessageContainerProps {
  message: AgentMessage | null;
  tools?: AgentTool[];
  isStreaming?: boolean;
  pendingToolCalls?: Set<string>;
  toolResultsById?: Map<string, ToolResultMessage>;
  onCostClick?: () => void;
  onOpenArtifact?: (filename: string) => void;
}

export function StreamingMessageContainer({
  message,
  tools = [],
  isStreaming = false,
  pendingToolCalls,
  toolResultsById = new Map(),
  onCostClick,
  onOpenArtifact,
}: StreamingMessageContainerProps) {
  if (!message) {
    if (isStreaming) {
      return (
        <div className="flex flex-col gap-3">
          <span className="mx-4 inline-block h-4 w-2 animate-pulse rounded bg-sidebar-muted" />
        </div>
      );
    }
    return null;
  }

  if (message.role === "toolResult" || message.role === "user") {
    return null;
  }

  if (message.role === "assistant") {
    return (
      <div className="flex flex-col gap-3">
        <AssistantMessage
          message={message as any}
          tools={tools}
          pendingToolCalls={pendingToolCalls}
          toolResultsById={toolResultsById}
          isStreaming={isStreaming}
          hidePendingToolCalls={false}
          onCostClick={onCostClick}
          onOpenArtifact={onOpenArtifact}
        />
        {isStreaming ? (
          <span className="mx-4 inline-block h-4 w-2 animate-pulse rounded bg-sidebar-muted" />
        ) : null}
      </div>
    );
  }

  return null;
}
