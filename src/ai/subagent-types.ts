import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { Artifact } from "./artifacts/types";

export const SUBAGENT_TOOL_NAME = "subtasks";

export interface Subtask {
  id: string;
  label: string;
  prompt: string;
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
  status: SubtaskStatus;
  run?: SubtaskRun;
}

export interface SubtasksToolParams {
  subtasks: Subtask[];
}
