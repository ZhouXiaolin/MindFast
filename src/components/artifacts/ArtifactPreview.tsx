import { useEffect, useState, type ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { FileCode2, FileText, Globe, Terminal, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { CodeBlock } from "../chat/CodeBlock";
import { MarkdownContent } from "../chat/MarkdownContent";
import { SandboxedIframe, type SandboxConsoleEntry } from "./SandboxedIframe";

interface ArtifactPreviewProps {
  filename: string;
  content: string;
}

type ArtifactKind = "html" | "markdown" | "text";
type ArtifactTab = "preview" | "code" | "console";

function getArtifactKind(filename: string): ArtifactKind {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  return "text";
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    json: "json",
    py: "python",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    sh: "bash",
    bash: "bash",
    svg: "xml",
  };
  return map[ext ?? ""] ?? "text";
}

function ArtifactTabTrigger({
  value,
  icon: Icon,
  children,
}: {
  value: ArtifactTab;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-sidebar-muted transition-colors",
        "data-[state=active]:bg-sidebar-panel-strong data-[state=active]:text-sidebar",
        "hover:text-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </Tabs.Trigger>
  );
}

export function ArtifactPreview({ filename, content }: ArtifactPreviewProps) {
  const artifactKind = getArtifactKind(filename);
  const defaultTab: ArtifactTab = artifactKind === "text" ? "code" : "preview";
  const [activeTab, setActiveTab] = useState<ArtifactTab>(defaultTab);
  const [consoleEntries, setConsoleEntries] = useState<SandboxConsoleEntry[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(defaultTab);
    setConsoleEntries([]);
    setRuntimeError(null);
  }, [defaultTab, filename, content]);

  const showPreview = artifactKind === "html" || artifactKind === "markdown";
  const showConsole = artifactKind === "html";

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ArtifactTab)}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex items-center justify-between gap-3 border-b border-sidebar-soft px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-sidebar">{filename}</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-sidebar-muted">
            {artifactKind === "html" ? <Globe className="h-3.5 w-3.5" /> : artifactKind === "markdown" ? <FileText className="h-3.5 w-3.5" /> : <FileCode2 className="h-3.5 w-3.5" />}
            <span>{artifactKind === "html" ? "Sandbox App" : artifactKind === "markdown" ? "Markdown" : getLanguageFromFilename(filename)}</span>
          </div>
        </div>
        <Tabs.List className="inline-flex items-center gap-1 rounded-full bg-sidebar-panel p-1">
          {showPreview ? <ArtifactTabTrigger value="preview" icon={artifactKind === "html" ? Globe : FileText}>Preview</ArtifactTabTrigger> : null}
          <ArtifactTabTrigger value="code" icon={FileCode2}>Code</ArtifactTabTrigger>
          {showConsole ? <ArtifactTabTrigger value="console" icon={Terminal}>Console</ArtifactTabTrigger> : null}
        </Tabs.List>
      </div>

      {showPreview ? (
        <Tabs.Content value="preview" className="flex-1 min-h-0 outline-none">
          {artifactKind === "html" ? (
            <div className="flex h-full min-h-0 flex-col p-4">
              <div className="flex-1 overflow-hidden rounded-[1.25rem] border border-sidebar-soft bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                <SandboxedIframe
                  htmlContent={content}
                  className="h-full w-full border-0 bg-white"
                  onConsoleMessage={(entry) => {
                    setConsoleEntries((current) => [...current, entry]);
                    if (entry.type === "error") {
                      setRuntimeError(entry.text);
                    }
                  }}
                  onRuntimeError={setRuntimeError}
                />
              </div>
              {runtimeError ? (
                <div className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {runtimeError}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="h-full overflow-auto p-5">
              <div className="mx-auto max-w-3xl rounded-[1.5rem] bg-sidebar-panel px-5 py-4">
                <MarkdownContent content={content} />
              </div>
            </div>
          )}
        </Tabs.Content>
      ) : null}

      <Tabs.Content value="code" className="flex-1 min-h-0 overflow-auto p-4 outline-none">
        <CodeBlock code={content} language={getLanguageFromFilename(filename)} className="h-full min-h-full rounded-[1.25rem] px-4 py-4" />
      </Tabs.Content>

      {showConsole ? (
        <Tabs.Content value="console" className="flex-1 min-h-0 overflow-auto p-4 outline-none">
          <div className="rounded-[1.25rem] border border-sidebar-soft bg-sidebar-panel p-4">
            {consoleEntries.length > 0 ? (
              <div className="space-y-2 font-mono text-xs text-sidebar">
                {consoleEntries.map((entry, index) => (
                  <div
                    key={`${entry.type}-${index}`}
                    className={cn(
                      "rounded-xl px-3 py-2",
                      entry.type === "error"
                        ? "bg-red-500/10 text-red-300"
                        : entry.type === "warn"
                          ? "bg-amber-500/10 text-amber-200"
                          : "bg-sidebar-panel-strong"
                    )}
                  >
                    <span className="mr-2 text-[10px] uppercase tracking-[0.18em] text-sidebar-muted">
                      {entry.type}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{entry.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-sidebar-muted">No console output yet.</div>
            )}
          </div>
        </Tabs.Content>
      ) : null}
    </Tabs.Root>
  );
}
