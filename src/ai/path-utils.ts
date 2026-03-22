// Pure path utilities — no project imports, safe to import from anywhere.

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
  if (!trimmedPath) return "Path must not be empty.";
  if (trimmedPath.startsWith("~")) return "Home-relative paths are not supported in the browser workspace.";
  if (/^[a-zA-Z]:[\\/]/.test(trimmedPath)) return "Host filesystem paths are not supported in the browser workspace.";

  const normalized: string[] = [];
  for (const segment of splitWorkspacePath(trimmedPath)) {
    if (segment === "..") {
      if (normalized.length === 0) return `Path ${inputPath} escapes the workspace root.`;
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

export function getDisplayPath(inputPath: string): string {
  const path = normalizeWorkspacePath(inputPath);
  return path || "/";
}
