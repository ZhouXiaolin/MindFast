import type { AgentMessage, AgentTool } from "@mariozechner/pi-agent-core";
import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { AssistantMessage } from "./AssistantMessage";

interface StreamingMessageContainerProps {
  message: AgentMessage | null;
  tools?: AgentTool[];
  isStreaming?: boolean;
  pendingToolCalls?: Set<string>;
  toolResultsById?: Map<string, ToolResultMessage>;
  onOpenArtifact?: (filename: string) => void;
}

export function StreamingMessageContainer({
  message,
  tools = [],
  isStreaming = false,
  pendingToolCalls,
  toolResultsById = new Map(),
  onOpenArtifact,
}: StreamingMessageContainerProps) {
  if (!message) {
    if (isStreaming) {
      return (
        <div className="assistant-message-container flex flex-col gap-3">
          <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded bg-sidebar-muted" />
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
          onOpenArtifact={onOpenArtifact}
        />
        {isStreaming ? (
          <div className="assistant-message-container flex">
            <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded bg-sidebar-muted" />
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
