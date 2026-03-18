import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import type { ArtifactRendererProps } from "./types";
import { base64ToArrayBuffer, decodeBase64, downloadBlob } from "./base64-utils";

export function PdfArtifact({ filename, content }: ArtifactRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const arrayBuffer = base64ToArrayBuffer(content);
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        if (cancelled) { pdf.destroy(); return; }

        const container = containerRef.current;
        if (!container) { pdf.destroy(); return; }
        container.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "p-4";
        container.appendChild(wrapper);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className =
            "w-full max-w-full h-auto block mx-auto bg-white rounded shadow-sm border border-sidebar-soft mb-4 last:mb-0";
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          wrapper.appendChild(canvas);
        }
        pdf.destroy();
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load PDF");
      }
    })();

    return () => { cancelled = true; };
  }, [content]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="rounded-lg border border-semantic-error/30 bg-semantic-error/10 p-4 text-sm text-semantic-error">
          <div className="font-medium mb-1">Error loading PDF</div>
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
          onClick={() => downloadBlob(decodeBase64(content), filename, "application/pdf")}
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
