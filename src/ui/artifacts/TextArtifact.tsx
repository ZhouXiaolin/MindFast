import { Copy, Download } from "lucide-react";
import { CodeBlock } from "../chat/CodeBlock";
import type { ArtifactRendererProps } from "./types";
import { getLanguageFromFilename } from "./types";
import { downloadBlob } from "./base64-utils";

export function TextArtifact({ filename, content }: ArtifactRendererProps) {
  const language = getLanguageFromFilename(filename);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-sidebar-soft px-3 py-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => navigator.clipboard.writeText(content)} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Copy">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => downloadBlob(content, filename, "text/plain")} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Download">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <CodeBlock code={content} language={language} className="h-full min-h-full rounded-none border-0" />
      </div>
    </div>
  );
}
