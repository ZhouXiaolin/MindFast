import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { FileSearch } from "lucide-react";
import type { ReadToolArgs } from "../../../ai/file-tools";
import { CodeBlock } from "../CodeBlock";
import type { ToolRenderResult } from "./types";

function getResultText(result: ToolResultMessage | undefined): string {
  if (!result?.content) return "";
  return result.content
    .filter((item) => (item as { type?: string }).type === "text")
    .map((item) => (item as { text?: string }).text ?? "")
    .join("\n");
}

function getLanguageFromPath(path?: string): string {
  if (!path) return "text";
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    html: "html", css: "css", json: "json", py: "python", md: "markdown",
    yaml: "yaml", yml: "yaml", sh: "bash", bash: "bash", svg: "svg",
  };
  return map[ext ?? ""] ?? "text";
}

export function renderReadTool(
  _toolName: string,
  params: ReadToolArgs | undefined,
  result: ToolResultMessage | undefined,
  isStreaming?: boolean
): ToolRenderResult {
  const text = getResultText(result);
  const stateLabel = result ? "Read file" : isStreaming ? "Reading file" : "Read file";

  return {
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-sidebar-muted">
          {result ? (
            <span className="h-3.5 w-3.5 rounded-full bg-accent/80" />
          ) : (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sidebar-muted border-t-sidebar" />
          )}
          <FileSearch className="h-3.5 w-3.5 shrink-0" />
          <span className={result?.isError ? "text-semantic-error" : result ? "text-accent" : ""}>
            {stateLabel}
          </span>
          {params?.path ? (
            <span className="rounded-full border border-sidebar-soft bg-sidebar-panel px-2 py-0.5 text-xs text-sidebar-muted">
              {params.path}
            </span>
          ) : null}
        </div>
        {result ? (
          <CodeBlock code={text || "(empty)"} language={getLanguageFromPath(params?.path)} />
        ) : null}
      </div>
    ),
  };
}
