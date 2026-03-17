import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { AssistantMessage as AssistantMessageType, ToolResultMessage } from "@mariozechner/pi-ai";
import { formatUsage } from "../../lib/format";
import { cn } from "../../lib/cn";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolMessage } from "./ToolMessage";
import { MarkdownContent } from "./MarkdownContent";

interface AssistantMessageProps {
  message: AssistantMessageType;
  tools?: AgentTool[];
  pendingToolCalls?: Set<string>;
  toolResultsById?: Map<string, ToolResultMessage>;
  isStreaming?: boolean;
  hidePendingToolCalls?: boolean;
  onCostClick?: () => void;
  onOpenArtifact?: (filename: string) => void;
}

export function AssistantMessage({
  message,
  tools = [],
  pendingToolCalls,
  toolResultsById,
  isStreaming = false,
  hidePendingToolCalls = false,
  onCostClick,
  onOpenArtifact,
}: AssistantMessageProps) {
  const content = message.content ?? [];
  const parts: React.ReactNode[] = [];

  for (const chunk of content) {
    if (chunk.type === "text" && (chunk as { text?: string }).text?.trim()) {
      const text = (chunk as { text: string }).text;
      parts.push(
        <MarkdownContent key={parts.length} content={text} />
      );
    } else if (chunk.type === "thinking" && (chunk as { thinking?: string }).thinking?.trim()) {
      const thinking = (chunk as { thinking: string }).thinking;
      parts.push(
        <ThinkingBlock key={parts.length} content={thinking} isStreaming={isStreaming} />
      );
    } else if (chunk.type === "toolCall") {
      const tc = chunk as { id: string; name: string; arguments?: unknown };
      const pending = pendingToolCalls?.has(tc.id) ?? false;
      const result = toolResultsById?.get(tc.id);
      if (hidePendingToolCalls && pending && !result) continue;
      const tool = tools.find((t) => t.name === tc.name);
      const aborted =
        (message as { stopReason?: string }).stopReason === "aborted" && !result;
      parts.push(
        <ToolMessage
          key={tc.id}
          toolCall={chunk as any}
          tool={tool}
          result={result}
          pending={pending}
          aborted={aborted}
          isStreaming={isStreaming}
          onOpenArtifact={onOpenArtifact}
        />
      );
    }
  }

  const usage = (message as { usage?: { input?: number; output?: number; cacheRead?: number; cacheWrite?: number; cost?: { total?: number } } }).usage;
  const stopReason = (message as { stopReason?: string }).stopReason;
  const errorMessage = (message as { errorMessage?: string }).errorMessage;

  return (
    <div className="flex flex-col gap-3">
      {parts.length > 0 ? <div className="flex flex-col gap-3">{parts}</div> : null}
      {usage && !isStreaming ? (
        <div
          className={cn(
            "text-xs text-sidebar-muted",
            onCostClick && "cursor-pointer transition-colors hover:text-sidebar"
          )}
          onClick={onCostClick}
          onKeyDown={(e) => onCostClick && e.key === "Enter" && onCostClick()}
          role={onCostClick ? "button" : undefined}
          tabIndex={onCostClick ? 0 : undefined}
        >
          {formatUsage(usage)}
        </div>
      ) : null}
      {stopReason === "error" && errorMessage ? (
        <div className="rounded-lg border border-semantic-error/30 bg-semantic-error/10 p-3 text-sm text-semantic-error">
          <strong>Error:</strong> {errorMessage}
        </div>
      ) : null}
      {stopReason === "aborted" ? (
        <span className="text-sm italic text-semantic-error">Request aborted</span>
      ) : null}
    </div>
  );
}
