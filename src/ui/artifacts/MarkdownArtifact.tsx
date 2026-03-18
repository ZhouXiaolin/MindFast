import { useState } from "react";
import { Code2, Eye, Copy, Download } from "lucide-react";
import { cn } from "../../utils/cn";
import { MarkdownContent } from "../chat/MarkdownContent";
import { CodeBlock } from "../chat/CodeBlock";
import type { ArtifactRendererProps } from "./types";
import { downloadBlob } from "./base64-utils";

export function MarkdownArtifact({ filename, content }: ArtifactRendererProps) {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-sidebar-soft px-3 py-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setViewMode("preview")} className={cn("rounded-md px-2 py-1 text-xs", viewMode === "preview" ? "bg-sidebar-panel-strong text-sidebar" : "text-sidebar-muted hover:text-sidebar")}>
            <Eye className="mr-1 inline h-3 w-3" />Preview
          </button>
          <button type="button" onClick={() => setViewMode("code")} className={cn("rounded-md px-2 py-1 text-xs", viewMode === "code" ? "bg-sidebar-panel-strong text-sidebar" : "text-sidebar-muted hover:text-sidebar")}>
            <Code2 className="mr-1 inline h-3 w-3" />Code
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => navigator.clipboard.writeText(content)} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Copy"><Copy className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => downloadBlob(content, filename, "text/markdown")} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Download"><Download className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {viewMode === "preview" ? (
          <div className="p-4"><MarkdownContent content={content} /></div>
        ) : (
          <CodeBlock code={content} language="markdown" className="h-full min-h-full rounded-none border-0" />
        )}
      </div>
    </div>
  );
}
