import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { AssistantMessage, ToolResultMessage } from "@mariozechner/pi-ai";

interface EditToolArgsLike {
  append?: boolean;
}

interface ToolCallLike {
  id: string;
  name: string;
  arguments?: unknown;
}

function parseEditToolArgs(args: unknown): EditToolArgsLike | null {
  if (typeof args === "string") {
    try {
      return JSON.parse(args) as EditToolArgsLike;
    } catch {
      return null;
    }
  }

  if (typeof args === "object" && args !== null) {
    return args as EditToolArgsLike;
  }

  return null;
}

export function isSilentAppendEditToolCall(toolName: string, args: unknown): boolean {
  if (toolName !== "edit") {
    return false;
  }

  return parseEditToolArgs(args)?.append === true;
}

export function collectSilentAppendToolCallIds(messages: AgentMessage[]): Set<string> {
  const silentToolCallIds = new Set<string>();

  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }

    const content = (message as AssistantMessage).content ?? [];
    for (const chunk of content) {
      if (chunk.type !== "toolCall") {
        continue;
      }

      const toolCall = chunk as ToolCallLike;
      if (isSilentAppendEditToolCall(toolCall.name, toolCall.arguments)) {
        silentToolCallIds.add(toolCall.id);
      }
    }
  }

  return silentToolCallIds;
}

export function sanitizeAssistantMessageForDisplay(
  message: AssistantMessage
): AssistantMessage | null {
  const content = (message.content ?? []).filter((chunk) => {
    if (chunk.type !== "toolCall") {
      return true;
    }

    const toolCall = chunk as ToolCallLike;
    return !isSilentAppendEditToolCall(toolCall.name, toolCall.arguments);
  });

  const hasVisibleContent = content.some((chunk) => {
    if (chunk.type === "text") {
      return !!(chunk as { text?: string }).text?.trim();
    }

    if (chunk.type === "thinking") {
      return !!(chunk as { thinking?: string }).thinking?.trim();
    }

    return chunk.type === "toolCall";
  });

  if (!hasVisibleContent && !(message as { errorMessage?: string }).errorMessage) {
    return null;
  }

  return {
    ...message,
    content,
  };
}

export function shouldDisplayToolResult(
  message: AgentMessage,
  silentToolCallIds: Set<string>
): message is ToolResultMessage & { toolCallId: string } {
  if (message.role !== "toolResult") {
    return false;
  }

  const toolResult = message as ToolResultMessage & { toolCallId: string };
  return !silentToolCallIds.has(toolResult.toolCallId);
}
