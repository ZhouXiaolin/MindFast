import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { Terminal } from "lucide-react";
import type { BashToolArgs } from "../../../ai/tools";
import { extractSubtasksFromToolCall, type SubtasksToolParams } from "../../../ai/subagent-types";
import { renderSubagentTool } from "./SubagentToolRenderer";
import type { ToolRenderResult } from "./types";

function getResultText(result: ToolResultMessage | undefined): string {
  if (!result?.content) return "";
  return result.content
    .filter((item) => (item as { type?: string }).type === "text")
    .map((item) => (item as { text?: string }).text ?? "")
    .join("\n");
}

export function renderBashTool(
  toolName: string,
  params: BashToolArgs | undefined,
  result: ToolResultMessage | undefined,
  isStreaming?: boolean,
  toolCallId?: string
): ToolRenderResult {
  const subtasks = extractSubtasksFromToolCall(toolName, params);
  if (subtasks && toolCallId) {
    return renderSubagentTool(
      toolName,
      { subtasks } as SubtasksToolParams,
      result,
      isStreaming,
      toolCallId
    );
  }

  const text = getResultText(result);

  return {
    content: (
      <div className="overflow-hidden rounded-2xl border border-sidebar-soft bg-sidebar-panel">
        <div className="flex items-center gap-2 border-b border-sidebar-soft px-3 py-2 text-sm text-sidebar-muted">
          {result ? (
            <span className="h-3.5 w-3.5 rounded-full bg-accent/80" />
          ) : (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sidebar-muted border-t-sidebar" />
          )}
          <Terminal className="h-3.5 w-3.5 shrink-0" />
          <span className={result?.isError ? "text-semantic-error" : result ? "text-accent" : ""}>
            {result ? "Ran bash command" : "Running bash command"}
          </span>
        </div>
        <div className="space-y-2 px-3 py-3">
          <pre className="overflow-x-auto rounded-xl bg-sidebar-panel-strong px-3 py-2 text-xs font-mono text-sidebar whitespace-pre-wrap">
            <span className="text-sidebar-muted">$ </span>
            {params?.command || "(empty command)"}
          </pre>
          {params?.stdin ? (
            <pre className="overflow-x-auto rounded-xl border border-sidebar-soft bg-sidebar-panel px-3 py-2 text-xs font-mono text-sidebar whitespace-pre-wrap">
              {params.stdin}
            </pre>
          ) : null}
          {result ? (
            <pre className="overflow-x-auto rounded-xl border border-sidebar-soft bg-sidebar-panel px-3 py-3 text-xs font-mono text-sidebar whitespace-pre-wrap">
              {text || "(no output)"}
            </pre>
          ) : null}
        </div>
      </div>
    ),
    isCustom: true,
  };
}
