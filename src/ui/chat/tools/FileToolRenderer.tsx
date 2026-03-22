import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { FileCode2, ChevronDown, ChevronUp } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useEffect, useState } from "react";
import type { EditToolArgs, WriteToolArgs } from "../../../ai/file-tools";
import type { FileToolResultDetails } from "../../../ai/workspace-types";
import { resolveWorkspaceKind } from "../../../extensions";
import { CodeBlock } from "../CodeBlock";
import { InlineArtifactPreview } from "../../artifacts/InlineArtifactPreview";
import { ArtifactPill } from "./ArtifactPill";
import type { ToolRenderResult } from "./types";

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

interface ToolHeaderProps {
  state: "inprogress" | "complete" | "error";
  label: string;
  path?: string;
  children?: React.ReactNode;
  onOpenArtifact?: (filename: string) => void;
  forceArtifactLink?: boolean;
}

function ToolHeader({
  state,
  label,
  path,
  children,
  onOpenArtifact,
  forceArtifactLink = false,
}: ToolHeaderProps) {
  const kind = resolveWorkspaceKind(path ?? "");
  const isWidget = kind === "widget";
  const [open, setOpen] = useState(() => isWidget || state !== "inprogress");
  const hasContent = !!children;
  const shouldOpenArtifact = forceArtifactLink && !!path && kind === "artifact" && !!onOpenArtifact;

  useEffect(() => {
    if (isWidget) {
      setOpen(true);
    }
  }, [isWidget, path, state]);

  const headerContent = (
    <div className="flex items-center gap-2 text-sm text-sidebar-muted">
      {state === "inprogress" ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sidebar-muted border-t-sidebar" />
      ) : state === "complete" ? (
        <span className="h-3.5 w-3.5 rounded-full bg-accent/80" />
      ) : (
        <span className="h-3.5 w-3.5 rounded-full bg-semantic-error/80" />
      )}
      <FileCode2 className="h-3.5 w-3.5 shrink-0" />
      <span className={state === "error" ? "text-semantic-error" : state === "complete" ? "text-accent" : ""}>
        {label}
      </span>
      {path && kind === "artifact" ? (
        <ArtifactPill filename={path} onOpen={onOpenArtifact} interactive={!shouldOpenArtifact} />
      ) : path ? (
        <span className="rounded-full border border-sidebar-soft bg-sidebar-panel px-2 py-0.5 text-xs text-sidebar-muted">
          {path}
        </span>
      ) : null}
    </div>
  );

  if (shouldOpenArtifact) {
    return (
      <button
        type="button"
        onClick={() => onOpenArtifact?.(path)}
        className="flex w-full items-center justify-between gap-2 rounded text-left transition-colors hover:text-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {headerContent}
      </button>
    );
  }

  if (!hasContent) {
    return headerContent;
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="flex w-full items-center justify-between gap-2 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        {headerContent}
        <span className="shrink-0 text-sidebar-muted">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}

function getResultText(result: ToolResultMessage | undefined): string {
  if (!result?.content) return "";
  return result.content
    .filter((item) => (item as { type?: string }).type === "text")
    .map((item) => (item as { text?: string }).text ?? "")
    .join("\n");
}

function getFileDetails(result: ToolResultMessage | undefined): FileToolResultDetails | undefined {
  return (result as { details?: FileToolResultDetails } | undefined)?.details;
}

export function renderFileTool(
  toolName: "write" | "edit",
  params: WriteToolArgs | EditToolArgs | undefined,
  result: ToolResultMessage | undefined,
  isStreaming?: boolean,
  onOpenArtifact?: (filename: string) => void
): ToolRenderResult | null {
  const requestedPath = (params as { path?: string } | undefined)?.path;
  const details = getFileDetails(result);
  const path = details?.path ?? requestedPath;
  const kind = resolveWorkspaceKind(path ?? "");

  if (kind === "plan") {
    return null;
  }

  const state = result
    ? result.isError
      ? "error"
      : "complete"
    : isStreaming
      ? "inprogress"
      : "complete";

  const labels = toolName === "write"
    ? { streaming: "Writing file", complete: "Wrote file" }
    : { streaming: "Editing file", complete: "Edited file" };
  const finalContent = details?.content;
  const draftContent = toolName === "write" ? (params as WriteToolArgs | undefined)?.content : undefined;
  const previewContent = finalContent ?? draftContent;

  if (!result) {
    return {
      content: (
        <ToolHeader
          state={state}
          label={labels.streaming}
          path={path}
          onOpenArtifact={onOpenArtifact}
        >
          {kind === "widget" && previewContent !== undefined ? (
            <div className="overflow-hidden rounded-2xl border border-sidebar-soft bg-sidebar-panel">
              <div className="p-2">
                <InlineArtifactPreview filename={path ?? "widget.txt"} content={previewContent} growWithContent />
              </div>
            </div>
          ) : toolName === "write" && previewContent !== undefined ? (
            <CodeBlock code={previewContent} language={getLanguageFromPath(path)} />
          ) : toolName === "edit" && params ? (
            <CodeBlock
              code={`- ${(params as EditToolArgs).old_str}\n+ ${(params as EditToolArgs).new_str}`}
              language="text"
            />
          ) : null}
        </ToolHeader>
      ),
    };
  }

  const body = kind === "widget" && finalContent !== undefined ? (
    <div className="overflow-hidden rounded-2xl border border-sidebar-soft bg-sidebar-panel">
      <div className="p-2">
        <InlineArtifactPreview filename={path ?? "widget.txt"} content={finalContent} />
      </div>
    </div>
  ) : kind === "artifact" ? null : toolName === "edit" && params ? (
    <CodeBlock
      code={`- ${(params as EditToolArgs).old_str}\n+ ${(params as EditToolArgs).new_str}`}
      language="text"
    />
  ) : finalContent !== undefined ? (
    <CodeBlock code={finalContent} language={getLanguageFromPath(path)} />
  ) : null;

  const errorText = result.isError ? getResultText(result) || "An error occurred" : "";

  return {
    content: (
      <div className="space-y-2">
        <ToolHeader
          state={state}
          label={state === "complete" ? labels.complete : labels.streaming}
          path={path}
          onOpenArtifact={onOpenArtifact}
          forceArtifactLink={state === "complete" && !result.isError}
        >
          {body}
        </ToolHeader>
        {errorText ? (
          <div className="text-sm text-semantic-error">{errorText}</div>
        ) : null}
      </div>
    ),
  };
}
