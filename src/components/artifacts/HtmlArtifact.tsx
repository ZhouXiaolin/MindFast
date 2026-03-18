import { useState } from "react";
import { Code2, Eye, RefreshCw, Copy, Download } from "lucide-react";
import { cn } from "../../lib/cn";
import { SandboxedIframe, type SandboxConsoleEntry } from "./SandboxedIframe";
import { CodeBlock } from "../chat/CodeBlock";
import type { ArtifactRendererProps } from "./types";
import { downloadBlob } from "./base64-utils";

export function HtmlArtifact({ filename, content }: ArtifactRendererProps) {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [consoleEntries, setConsoleEntries] = useState<SandboxConsoleEntry[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-sidebar-soft px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={cn("rounded-md px-2 py-1 text-xs", viewMode === "preview" ? "bg-sidebar-panel-strong text-sidebar" : "text-sidebar-muted hover:text-sidebar")}
          >
            <Eye className="mr-1 inline h-3 w-3" />Preview
          </button>
          <button
            type="button"
            onClick={() => setViewMode("code")}
            className={cn("rounded-md px-2 py-1 text-xs", viewMode === "code" ? "bg-sidebar-panel-strong text-sidebar" : "text-sidebar-muted hover:text-sidebar")}
          >
            <Code2 className="mr-1 inline h-3 w-3" />Code
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => { setConsoleEntries([]); setRefreshKey(k => k + 1); }} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Reload">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => navigator.clipboard.writeText(content)} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Copy HTML">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => downloadBlob(content, filename, "text/html")} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Download">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <div className={cn("absolute inset-0 flex flex-col", viewMode !== "preview" && "hidden")}>
          <SandboxedIframe
            key={refreshKey}
            htmlContent={content}
            className="flex-1 w-full border-0 bg-white"
            onConsoleMessage={(entry) => setConsoleEntries(prev => [...prev, entry])}
            onRuntimeError={setRuntimeError}
          />
          {consoleEntries.length > 0 && (
            <div className="max-h-32 overflow-auto border-t border-sidebar-soft bg-sidebar-panel p-2">
              <div className="space-y-1 font-mono text-xs">
                {consoleEntries.map((entry, i) => (
                  <div key={i} className={cn("px-2 py-0.5 rounded", entry.type === "error" ? "text-semantic-error" : entry.type === "warn" ? "text-semantic-warning" : "text-sidebar-muted")}>
                    <span className="mr-1 text-[10px] uppercase opacity-50">{entry.type}</span>
                    {entry.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={cn("absolute inset-0 overflow-auto", viewMode !== "code" && "hidden")}>
          <CodeBlock code={content} language="html" className="h-full min-h-full rounded-none border-0" />
        </div>
      </div>
      {runtimeError && viewMode === "preview" && (
        <div className="border-t border-semantic-error/25 bg-semantic-error/10 px-3 py-2 text-xs text-semantic-error">
          {runtimeError}
        </div>
      )}
    </div>
  );
}
