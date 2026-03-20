import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { WorkspaceFile } from "./workspace/types";
import {
  BASH_TOOL_NAME,
  SUBAGENT_BASH_COMMAND,
  tryParseSubagentPayload,
  type BashToolParams,
} from "./workspace-types";

export const SUBAGENT_TOOL_NAME = BASH_TOOL_NAME;

export interface Subtask {
  id: string;
  label: string;
  prompt: string;
}

export function getSubtaskRunKey(toolCallId: string, subtaskId: string): string {
  return `${toolCallId}:${subtaskId}`;
}

export type SubtaskStatus = "pending" | "running" | "completed" | "failed";

export interface SubtaskRun {
  messages: AgentMessage[];
  streamMessage: AgentMessage | null;
  isStreaming: boolean;
  files: WorkspaceFile[];
  error?: string;
}

export interface SubtaskWithResult extends Subtask {
  toolCallId: string;
  runKey: string;
  status: SubtaskStatus;
  run?: SubtaskRun;
}

export interface SubtasksToolParams {
  subtasks: Subtask[];
}

export function extractSubtasksFromToolCall(
  toolName: string,
  args: unknown
): Subtask[] | null {
  if (toolName !== BASH_TOOL_NAME) {
    return null;
  }

  const bashArgs = args as Partial<BashToolParams> | undefined;
  if (bashArgs?.command?.trim() !== SUBAGENT_BASH_COMMAND) {
    return null;
  }

  return tryParseSubagentPayload(bashArgs.stdin)?.subtasks ?? null;
}
