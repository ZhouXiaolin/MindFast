import { useState } from "react";
import { RefreshCw, Copy, Download } from "lucide-react";
import { cn } from "../../utils/cn";
import { SandboxedIframe, type SandboxConsoleEntry } from "./SandboxedIframe";
import { CodeBlock } from "../chat/CodeBlock";
import type { ArtifactRendererProps } from "./types";
import { downloadBlob } from "./base64-utils";

function wrapJavaScriptInHtml(code: string): string {
  const escapedCode = code.replace(/<\/script/gi, "<\\/script");

  return `<!DOCTYPE html>
<html>
<head></head>
<body>
<script type="module">
(async () => {
  try {
    const __result = await (async function() {
      ${escapedCode}
    })();
    if (__result !== undefined) {
      console.log('=>', typeof __result === 'object' ? JSON.stringify(__result, null, 2) : __result);
    }
  } catch (error) {
    console.error(error.message || String(error));
  }
})();
</script>
</body>
</html>`;
}

export function JavaScriptArtifact({ filename, content }: ArtifactRendererProps) {
  const [consoleEntries, setConsoleEntries] = useState<SandboxConsoleEntry[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const wrappedHtml = wrapJavaScriptInHtml(content);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-sidebar-soft px-3 py-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => { setConsoleEntries([]); setRuntimeError(null); setRefreshKey(k => k + 1); }} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Reload">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => navigator.clipboard.writeText(content)} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Copy">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => downloadBlob(content, filename, "application/javascript")} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Download">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <CodeBlock code={content} language="javascript" className="h-full min-h-full rounded-none border-0" />
      </div>
      {(consoleEntries.length > 0 || runtimeError) && (
        <div className="max-h-40 overflow-auto border-t border-sidebar-soft bg-sidebar-panel p-2">
          <div className="space-y-1 font-mono text-xs">
            {consoleEntries.map((entry, i) => (
              <div key={i} className={cn("px-2 py-0.5 rounded", entry.type === "error" ? "text-semantic-error" : entry.type === "warn" ? "text-semantic-warning" : "text-sidebar-muted")}>
                <span className="mr-1 text-[10px] uppercase opacity-50">{entry.type}</span>
                {entry.text}
              </div>
            ))}
            {runtimeError && (
              <div className="px-2 py-0.5 rounded text-semantic-error">
                <span className="mr-1 text-[10px] uppercase opacity-50">error</span>
                {runtimeError}
              </div>
            )}
          </div>
        </div>
      )}
      <SandboxedIframe
        key={refreshKey}
        htmlContent={wrappedHtml}
        className="hidden"
        onConsoleMessage={(entry) => setConsoleEntries(prev => [...prev, entry])}
        onRuntimeError={setRuntimeError}
      />
    </div>
  );
}
