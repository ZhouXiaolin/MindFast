import type { Subtask } from "./subagent-types";
import { resolveWorkspaceKind } from "../extensions/registry";

export const BASH_TOOL_NAME = "bash";
export const SUBAGENT_BASH_COMMAND = "subagent";

export interface ReadToolParams {
  path: string;
  offset?: number;
  limit?: number;
}

export interface WriteToolParams {
  path: string;
  content: string;
}

export interface EditToolParams {
  path: string;
  old_str: string;
  new_str: string;
}

export interface BashToolParams {
  command: string;
  stdin?: string;
}

export interface FileToolResultDetails {
  path: string;
  content: string;
  action: "create" | "update";
  diff?: string;
  firstChangedLine?: number;
}

export interface BashSubagentPayload {
  subtasks: Subtask[];
}

export interface BashSubagentResultDetails {
  kind: "subagent";
  completed: number;
  failed: number;
  total: number;
}

export interface BashCommandResultDetails {
  kind: "command";
  command: string;
}

export {
  normalizeWorkspacePath,
  getWorkspacePathValidationError,
  getParentPath,
  getDisplayPath,
} from "./path-utils";

export function isArtifactPath(inputPath: string): boolean {
  return resolveWorkspaceKind(inputPath) === "artifact";
}

export function isWidgetPath(inputPath: string): boolean {
  return resolveWorkspaceKind(inputPath) === "widget";
}

export function isPlanPath(inputPath: string): boolean {
  return resolveWorkspaceKind(inputPath) === "plan";
}

export function tryParseSubagentPayload(stdin?: string): BashSubagentPayload | null {
  if (!stdin?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(stdin) as Partial<BashSubagentPayload>;
    if (!Array.isArray(parsed.subtasks)) {
      return null;
    }
    const subtasks = parsed.subtasks.filter((subtask): subtask is Subtask => {
      return (
        typeof subtask === "object" &&
        subtask !== null &&
        typeof (subtask as Subtask).id === "string" &&
        typeof (subtask as Subtask).label === "string" &&
        typeof (subtask as Subtask).prompt === "string"
      );
    });
    if (subtasks.length === 0) {
      return null;
    }
    return { subtasks };
  } catch {
    return null;
  }
}
