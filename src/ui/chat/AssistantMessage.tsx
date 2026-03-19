import { Copy } from "lucide-react";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { AssistantMessage as AssistantMessageType, ToolResultMessage } from "@mariozechner/pi-ai";
import { extractSubtasksFromToolCall, SUBAGENT_TOOL_NAME } from "../../ai/subagent-types";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolMessage } from "./ToolMessage";
import { MarkdownContent } from "./MarkdownContent";
import { isSilentAppendEditToolCall } from "./silentAppend";

interface AssistantMessageProps {
  message: AssistantMessageType;
  tools?: AgentTool[];
  pendingToolCalls?: Set<string>;
  toolResultsById?: Map<string, ToolResultMessage>;
  isStreaming?: boolean;
  hidePendingToolCalls?: boolean;
  onOpenArtifact?: (filename: string) => void;
}

function extractAssistantTextContent(content: AssistantMessageType["content"]): string {
  return (content ?? [])
    .flatMap((chunk) => (
      chunk.type === "text" && (chunk as { text?: string }).text?.trim()
        ? [(chunk as { text: string }).text]
        : []
    ))
    .join("\n\n");
}

export function AssistantMessage({
  message,
  tools = [],
  pendingToolCalls,
  toolResultsById,
  isStreaming = false,
  hidePendingToolCalls = false,
  onOpenArtifact,
}: AssistantMessageProps) {
  const content = message.content ?? [];
  const assistantText = extractAssistantTextContent(content);
  const canCopy = assistantText.trim().length > 0;
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
      if (isSilentAppendEditToolCall(tc.name, tc.arguments)) {
        continue;
      }
      const pending = pendingToolCalls?.has(tc.id) ?? false;
      const result = toolResultsById?.get(tc.id);
      const isSubagentCall = !!extractSubtasksFromToolCall(tc.name, tc.arguments);
      const shouldHidePendingToolCall =
        hidePendingToolCalls &&
        pending &&
        !result &&
        !(tc.name === SUBAGENT_TOOL_NAME && isSubagentCall);
      if (shouldHidePendingToolCall) continue;
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

  const stopReason = (message as { stopReason?: string }).stopReason;
  const errorMessage = (message as { errorMessage?: string }).errorMessage;

  return (
    <div className="assistant-message-container flex flex-col gap-3">
      {parts.length > 0 ? <div className="flex flex-col gap-3">{parts}</div> : null}
      {canCopy ? (
        <div className="flex flex-wrap items-center gap-2 pl-1 text-xs text-sidebar-muted">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(assistantText)}
            className="inline-flex items-center gap-1 rounded-full bg-sidebar-panel px-2.5 py-1 transition-colors hover:bg-sidebar-hover hover:text-sidebar"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy</span>
          </button>
        </div>
      ) : null}
      {stopReason === "error" && errorMessage ? (
        <div className="rounded-2xl border border-semantic-error/30 bg-semantic-error/10 p-3 text-sm text-semantic-error">
          <strong>Error:</strong> {errorMessage}
        </div>
      ) : null}
      {stopReason === "aborted" ? (
        <span className="pl-1 text-sm italic text-semantic-error">Request aborted</span>
      ) : null}
    </div>
  );
}
