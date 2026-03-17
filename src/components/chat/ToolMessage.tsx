import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { ToolCall, ToolResultMessage } from "@mariozechner/pi-ai";
import { renderTool } from "./tools";
import { cn } from "../../lib/cn";

interface ToolMessageProps {
  toolCall: ToolCall;
  tool?: AgentTool;
  result?: ToolResultMessage;
  pending?: boolean;
  aborted?: boolean;
  isStreaming?: boolean;
  onOpenArtifact?: (filename: string) => void;
}

export function ToolMessage({
  toolCall,
  tool,
  result,
  pending = false,
  aborted = false,
  isStreaming = false,
  onOpenArtifact,
}: ToolMessageProps) {
  const toolName = tool?.name ?? toolCall.name;
  const effectiveResult = aborted
    ? ({
        role: "toolResult",
        isError: true,
        content: [],
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        timestamp: Date.now(),
      } as ToolResultMessage)
    : result;

  const renderResult = renderTool(
    toolName,
    toolCall.arguments,
    effectiveResult,
    isStreaming || pending,
    onOpenArtifact
  );

  if (renderResult.isCustom) {
    return <>{renderResult.content}</>;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-sidebar-soft bg-sidebar-panel px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--sidebar-fg)_0.04,transparent)]",
        "text-sidebar"
      )}
    >
      {renderResult.content}
    </div>
  );
}
