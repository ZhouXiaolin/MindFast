import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { Code } from "lucide-react";
import { CodeBlock } from "../CodeBlock";
import type { ToolRenderResult } from "./types";

function getTextOutput(result: ToolResultMessage | undefined): string {
  if (!result?.content) return "";
  return result.content
    .filter((c) => (c as { type: string }).type === "text")
    .map((c) => (c as { text: string }).text)
    .join("\n");
}

function prettyJson(value: unknown): { content: string; isJson: boolean } {
  try {
    if (typeof value === "string") {
      const parsed = JSON.parse(value);
      return { content: JSON.stringify(parsed, null, 2), isJson: true };
    }
    return { content: JSON.stringify(value, null, 2), isJson: true };
  } catch {
    return { content: typeof value === "string" ? value : String(value), isJson: false };
  }
}

function ToolHeader({
  state,
  label,
}: {
  state: "inprogress" | "complete" | "error";
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-sidebar-muted">
      {state === "inprogress" && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sidebar-muted border-t-sidebar" />
      )}
      {state === "complete" && (
        <span className="h-3.5 w-3.5 rounded-full bg-emerald-500/80" aria-hidden />
      )}
      {state === "error" && (
        <span className="h-3.5 w-3.5 rounded-full bg-red-500/80" aria-hidden />
      )}
      <Code className="h-3.5 w-3.5 shrink-0" />
      <span className={state === "error" ? "text-red-400" : state === "complete" ? "text-emerald-400" : ""}>
        {label}
      </span>
    </div>
  );
}

export function renderDefaultTool(
  _toolName: string,
  params: unknown,
  result: ToolResultMessage | undefined,
  isStreaming?: boolean
): ToolRenderResult {
  const state = result
    ? (result as { isError?: boolean }).isError
      ? "error"
      : "complete"
    : isStreaming
      ? "inprogress"
      : "complete";

  let paramsJson = "";
  if (params != null) {
    try {
      const parsed = typeof params === "string" ? JSON.parse(params) : params;
      paramsJson = JSON.stringify(parsed, null, 2);
    } catch {
      paramsJson = String(params);
    }
  }

  if (result) {
    const outputRaw = getTextOutput(result);
    const output = prettyJson(outputRaw);

    return {
      content: (
        <div className="space-y-3">
          <ToolHeader state={state} label="Tool Call" />
          {paramsJson ? (
            <div>
              <div className="mb-1 text-xs font-medium text-sidebar-muted">Input</div>
              <CodeBlock code={paramsJson} language="json" />
            </div>
          ) : null}
          <div>
            <div className="mb-1 text-xs font-medium text-sidebar-muted">Output</div>
            <CodeBlock code={output.content} language={output.isJson ? "json" : "text"} />
          </div>
        </div>
      ),
    };
  }

  if (paramsJson && (isStreaming ? paramsJson !== "{}" && paramsJson !== "null" : true)) {
    return {
      content: (
        <div className="space-y-3">
          <ToolHeader
            state={state}
            label={isStreaming && (!paramsJson || paramsJson === "{}" || paramsJson === "null") ? "Preparing tool parameters…" : "Tool Call"}
          />
          {paramsJson ? (
            <div>
              <div className="mb-1 text-xs font-medium text-sidebar-muted">Input</div>
              <CodeBlock code={paramsJson} language="json" />
            </div>
          ) : null}
        </div>
      ),
    };
  }

  return {
    content: (
      <div>
        <ToolHeader state={state} label="Preparing tool…" />
      </div>
    ),
  };
}
