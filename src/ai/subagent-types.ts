import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { Artifact } from "./artifacts/types";

export const SUBAGENT_TOOL_NAME = "subtasks";

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
  artifacts: Artifact[];
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
