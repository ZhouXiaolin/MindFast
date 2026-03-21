import type { Subtask } from "./subagent-types";

export const ARTIFACTS_DIR = "artifacts";
export const WIDGETS_DIR = "widgets";
export const PLANS_DIR = "plans";
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

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function splitWorkspacePath(inputPath: string): string[] {
  return inputPath
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment !== ".");
}

export function getWorkspacePathValidationError(inputPath: string): string | null {
  const trimmedPath = inputPath.trim();
  if (!trimmedPath) {
    return "Path must not be empty.";
  }

  if (trimmedPath.startsWith("~")) {
    return "Home-relative paths are not supported in the browser workspace.";
  }

  if (/^[a-zA-Z]:[\\/]/.test(trimmedPath)) {
    return "Host filesystem paths are not supported in the browser workspace.";
  }

  const normalized: string[] = [];
  for (const segment of splitWorkspacePath(trimmedPath)) {
    if (segment === "..") {
      if (normalized.length === 0) {
        return `Path ${inputPath} escapes the workspace root.`;
      }
      normalized.pop();
      continue;
    }

    normalized.push(segment);
  }

  return normalized.length === 0 ? "Path must point to a workspace entry." : null;
}

export function normalizeWorkspacePath(inputPath: string): string {
  const segments = splitWorkspacePath(inputPath);

  const normalized: string[] = [];
  for (const segment of segments) {
    if (segment === "..") {
      normalized.pop();
      continue;
    }
    normalized.push(segment);
  }

  return trimSlashes(normalized.join("/"));
}

export function getParentPath(inputPath: string): string {
  const path = normalizeWorkspacePath(inputPath);
  if (!path) return "";
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
}

export function isArtifactPath(inputPath: string): boolean {
  const path = normalizeWorkspacePath(inputPath);
  return path === ARTIFACTS_DIR || path.startsWith(`${ARTIFACTS_DIR}/`);
}

export function isWidgetPath(inputPath: string): boolean {
  const path = normalizeWorkspacePath(inputPath);
  return path === WIDGETS_DIR || path.startsWith(`${WIDGETS_DIR}/`);
}

export function isPlanPath(inputPath: string): boolean {
  const path = normalizeWorkspacePath(inputPath);
  return path === PLANS_DIR || path.startsWith(`${PLANS_DIR}/`);
}

export function getDisplayPath(inputPath: string): string {
  const path = normalizeWorkspacePath(inputPath);
  return path || "/";
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
