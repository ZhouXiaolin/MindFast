import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronUp, FileCode2 } from "lucide-react";
import type { ArtifactsParams } from "../../../pi/artifacts/types";
import { CodeBlock } from "../CodeBlock";
import type { ToolRenderResult } from "./types";
import { ArtifactPill } from "./ArtifactPill";

function getTextOutput(result: ToolResultMessage | undefined): string {
  if (!result?.content) return "";
  return result.content
    .filter((c) => (c as { type: string }).type === "text")
    .map((c) => (c as { text: string }).text)
    .join("\n");
}

function getLanguageFromFilename(filename?: string): string {
  if (!filename) return "text";
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    html: "html", css: "css", json: "json", py: "python", md: "markdown",
    yaml: "yaml", yml: "yaml", sh: "bash", bash: "bash",
  };
  return map[ext ?? ""] ?? "text";
}

const COMMAND_LABELS: Record<string, { streaming: string; complete: string }> = {
  create: { streaming: "Creating artifact", complete: "Created artifact" },
  update: { streaming: "Updating artifact", complete: "Updated artifact" },
  rewrite: { streaming: "Rewriting artifact", complete: "Rewrote artifact" },
  get: { streaming: "Getting artifact", complete: "Got artifact" },
  delete: { streaming: "Deleting artifact", complete: "Deleted artifact" },
  logs: { streaming: "Getting logs", complete: "Got logs" },
};

function ToolHeader({
  state,
  label,
  filename,
  onOpenArtifact,
  defaultOpen = false,
  children,
}: {
  state: "inprogress" | "complete" | "error";
  label: string;
  filename?: string;
  onOpenArtifact?: (filename: string) => void;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasContent = !!children;

  const statusIcon =
    state === "inprogress" ? (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sidebar-muted border-t-sidebar" />
    ) : state === "complete" ? (
      <span className="h-3.5 w-3.5 rounded-full bg-emerald-500/80" />
    ) : (
      <span className="h-3.5 w-3.5 rounded-full bg-red-500/80" />
    );

  const headerContent = (
    <div className="flex items-center gap-2 text-sm text-sidebar-muted">
      {state === "inprogress" && statusIcon}
      <FileCode2 className="h-3.5 w-3.5 shrink-0" />
      <span className={state === "error" ? "text-red-400" : state === "complete" ? "text-emerald-400" : ""}>
        {label}
      </span>
      {filename && (
        <ArtifactPill filename={filename} onOpen={onOpenArtifact} />
      )}
    </div>
  );

  if (!hasContent) {
    return <div className="flex items-center gap-2">{headerContent}</div>;
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="flex w-full items-center justify-between gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded">
        {headerContent}
        <span className="shrink-0 text-sidebar-muted">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}

export function renderArtifactsTool(
  _toolName: string,
  params: ArtifactsParams | undefined,
  result: ToolResultMessage | undefined,
  isStreaming?: boolean,
  onOpenArtifact?: (filename: string) => void
): ToolRenderResult {
  const state = result
    ? (result as { isError?: boolean }).isError
      ? "error"
      : "complete"
    : isStreaming
      ? "inprogress"
      : "complete";

  const command = params?.command;
  const filename = params?.filename;
  const labels = command ? COMMAND_LABELS[command] : { streaming: "Processing artifact", complete: "Processed artifact" };

  if (result?.isError) {
    const headerText = labels.streaming;
    if (command === "create" || command === "update" || command === "rewrite") {
      const content = params?.content ?? "";
      const isDiff = command === "update" && params?.old_str != null && params?.new_str != null;
      return {
        content: (
          <div>
            <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact}>
              {isDiff ? (
                <div className="space-y-2">
                  <div className="text-xs text-sidebar-muted">Diff</div>
                  <CodeBlock code={`- ${params.old_str}\n+ ${params.new_str}`} language="text" />
                </div>
              ) : content ? (
                <CodeBlock code={content} language={getLanguageFromFilename(filename)} />
              ) : null}
              <div className="mt-2 text-sm text-red-400">{getTextOutput(result) || "An error occurred"}</div>
            </ToolHeader>
          </div>
        ),
      };
    }
    return {
      content: (
        <div className="space-y-2">
          <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact} />
          <div className="text-sm text-red-400">{getTextOutput(result) || "An error occurred"}</div>
        </div>
      ),
    };
  }

  if (result && params) {
    const headerText = labels.complete;
    const output = getTextOutput(result);

    if (command === "get") {
      return {
        content: (
          <div>
            <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact} defaultOpen>
              <CodeBlock code={output || "(no output)"} language={getLanguageFromFilename(filename)} />
            </ToolHeader>
          </div>
        ),
      };
    }

    if (command === "logs") {
      return {
        content: (
          <div>
            <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact} defaultOpen>
              <pre className="overflow-x-auto rounded border border-sidebar bg-sidebar-hover/50 px-3 py-2 text-xs font-mono text-sidebar whitespace-pre-wrap">
                {output || "(no output)"}
              </pre>
            </ToolHeader>
          </div>
        ),
      };
    }

    if (command === "create" || command === "rewrite") {
      const content = params.content ?? "";
      const isHtml = filename?.endsWith(".html");
      const logs = output;
      return {
        content: (
          <div>
            <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact} defaultOpen>
              <div className="space-y-2">
                {content ? <CodeBlock code={content} language={getLanguageFromFilename(filename)} /> : null}
                {isHtml && logs ? (
                  <pre className="overflow-x-auto rounded border border-sidebar bg-sidebar-hover/50 px-3 py-2 text-xs font-mono text-sidebar whitespace-pre-wrap">
                    {logs}
                  </pre>
                ) : null}
              </div>
            </ToolHeader>
          </div>
        ),
      };
    }

    if (command === "update") {
      const oldStr = params.old_str ?? "";
      const newStr = params.new_str ?? "";
      const isHtml = filename?.endsWith(".html");
      const logs = output;
      return {
        content: (
          <div>
            <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact} defaultOpen>
              <div className="space-y-2">
                <CodeBlock code={`- ${oldStr}\n+ ${newStr}`} language="text" />
                {isHtml && logs ? (
                  <pre className="overflow-x-auto rounded border border-sidebar bg-sidebar-hover/50 px-3 py-2 text-xs font-mono text-sidebar whitespace-pre-wrap">
                    {logs}
                  </pre>
                ) : null}
              </div>
            </ToolHeader>
          </div>
        ),
      };
    }

    if (command === "delete") {
      return {
        content: (
          <div>
            <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact} />
          </div>
        ),
      };
    }
  }

  if (params) {
    const headerText = labels.streaming;
    if (!command) {
      return { content: <ToolHeader state={state} label="Preparing artifact…" /> };
    }
    if (command === "create" || command === "rewrite") {
      const content = params.content ?? "";
      return {
        content: (
          <div>
            <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact}>
              {content ? <CodeBlock code={content} language={getLanguageFromFilename(filename)} /> : null}
            </ToolHeader>
          </div>
        ),
      };
    }
    if (command === "update") {
      const oldStr = params.old_str ?? "";
      const newStr = params.new_str ?? "";
      return {
        content: (
          <div>
            <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact}>
              {oldStr !== undefined && newStr !== undefined ? (
                <CodeBlock code={`- ${oldStr}\n+ ${newStr}`} language="text" />
              ) : null}
            </ToolHeader>
          </div>
        ),
      };
    }
    return {
      content: <ToolHeader state={state} label={headerText} filename={filename} onOpenArtifact={onOpenArtifact} />,
    };
  }

  return { content: <ToolHeader state={state} label="Preparing artifact…" /> };
}
