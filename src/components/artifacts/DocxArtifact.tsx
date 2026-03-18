import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import type { ArtifactRendererProps } from "./types";
import { base64ToArrayBuffer, decodeBase64, downloadBlob } from "./base64-utils";

export function DocxArtifact({ filename, content }: ArtifactRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        const arrayBuffer = base64ToArrayBuffer(content);
        if (cancelled) return;
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "docx-wrapper-custom";
        container.appendChild(wrapper);

        await renderAsync(arrayBuffer, wrapper, undefined, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: true,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });

        const style = document.createElement("style");
        style.textContent = `
          .docx-wrapper-custom { max-width: 100%; overflow-x: auto; }
          .docx-wrapper-custom .docx-wrapper {
            max-width: 100% !important; margin: 0 !important;
            background: transparent !important; padding: 0 !important;
          }
          .docx-wrapper-custom .docx-wrapper > section.docx {
            box-shadow: none !important; border: none !important;
            margin: 0 !important; padding: 2em !important;
            background: white !important; color: black !important;
            max-width: 100% !important; width: 100% !important; min-width: 0 !important;
          }
          .docx-wrapper-custom table { max-width: 100% !important; }
          .docx-wrapper-custom img { max-width: 100% !important; height: auto !important; }
          .docx-wrapper-custom p, .docx-wrapper-custom span, .docx-wrapper-custom div {
            max-width: 100% !important; word-wrap: break-word !important; overflow-wrap: break-word !important;
          }
        `;
        container.appendChild(style);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load document");
      }
    })();

    return () => { cancelled = true; };
  }, [content]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="rounded-lg border border-semantic-error/30 bg-semantic-error/10 p-4 text-sm text-semantic-error">
          <div className="font-medium mb-1">Error loading document</div>
          <div className="text-xs opacity-90">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-sidebar-soft px-3 py-2">
        <button
          type="button"
          onClick={() =>
            downloadBlob(
              decodeBase64(content),
              filename,
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
          }
          className="rounded-md p-1 text-sidebar-muted hover:text-sidebar"
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto min-h-0" />
    </div>
  );
}
