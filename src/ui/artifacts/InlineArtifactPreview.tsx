import { useState } from "react";
import { useResolvedArtifactContent } from "./ArtifactPreviewContext";
import type { ArtifactRendererProps } from "./types";
import { getFileType } from "./types";
import { SandboxedIframe } from "./SandboxedIframe";
import { CodeBlock } from "../chat/CodeBlock";
import { MarkdownContent } from "../chat/MarkdownContent";

const INLINE_PREVIEW_MAX_HEIGHT = "min(420px, 50vh)";
/** When true, container can grow with content (e.g. widget streaming) up to 80vh */
const GROW_MAX_HEIGHT = "80vh";

function getImageUrl(content: string, filename: string): string {
  if (content.startsWith("data:")) return content;
  const ext = filename.split(".").pop()?.toLowerCase();
  const mime =
    ext === "jpg" || ext === "jpeg" ? "image/jpeg"
    : ext === "gif" ? "image/gif"
    : ext === "webp" ? "image/webp"
    : ext === "bmp" ? "image/bmp"
    : ext === "ico" ? "image/x-icon"
    : "image/png";
  return `data:${mime};base64,${content}`;
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

export interface InlineArtifactPreviewProps extends ArtifactRendererProps {
  /** When true, height grows with content (e.g. widget streaming). Uses larger max height and allows container to expand. */
  growWithContent?: boolean;
}

/**
 * Compact artifact preview for inline display in the conversation flow.
 * Renders preview (or code) in a bounded box so the artifact is visible without opening the side panel.
 */
export function InlineArtifactPreview({ filename, content, growWithContent = false }: InlineArtifactPreviewProps) {
  const resolved = useResolvedArtifactContent(filename, content);
  const fileType = getFileType(filename);
  const resolvedContent = resolved.content;
  const boxClass = "overflow-hidden rounded-xl border border-sidebar-soft bg-sidebar-panel";
  const maxHeight = growWithContent ? GROW_MAX_HEIGHT : INLINE_PREVIEW_MAX_HEIGHT;

  const [iframeHeight, setIframeHeight] = useState(200);

  if (!resolvedContent && resolved.statusText) {
    return (
      <div
        className={`${boxClass} flex items-center justify-center p-4 text-sm text-sidebar-muted`}
        style={{ maxHeight: growWithContent ? "none" : maxHeight, minHeight: growWithContent ? 120 : 120 }}
      >
        {resolved.statusText}
      </div>
    );
  }

  if (fileType === "html") {
    const containerStyle = { height: iframeHeight };
    return (
      <div className={boxClass} style={containerStyle}>
        <SandboxedIframe
          key={resolved.refreshToken ?? filename}
          htmlContent={resolvedContent}
          className="w-full h-full border-0 bg-white rounded-b-xl"
          continuousHeightUpdates={growWithContent}
          onHeightChange={setIframeHeight}
        />
      </div>
    );
  }

  if (fileType === "image") {
    return (
      <div className={`${boxClass} flex items-center justify-center p-3`} style={{ maxHeight }}>
        <img
          src={getImageUrl(resolvedContent, filename)}
          alt={filename}
          className="max-w-full max-h-[360px] object-contain"
        />
      </div>
    );
  }

  if (fileType === "svg") {
    return (
      <div
        className={`${boxClass} flex items-center justify-center p-3 overflow-auto`}
        style={{ maxHeight }}
        dangerouslySetInnerHTML={{ __html: resolvedContent }}
      />
    );
  }

  if (fileType === "markdown") {
    return (
      <div
        className={`${boxClass} overflow-auto p-4 text-sm`}
        style={{ maxHeight: growWithContent ? "none" : maxHeight, minHeight: growWithContent ? 120 : undefined }}
      >
        <MarkdownContent content={resolvedContent} />
      </div>
    );
  }

  if (
    fileType === "pdf" ||
    fileType === "docx" ||
    fileType === "excel"
  ) {
    return (
      <div
        className={`${boxClass} overflow-auto p-4 text-sm text-sidebar-muted`}
        style={{ maxHeight: 120 }}
      >
        Open in the side panel to view this file.
      </div>
    );
  }

  return (
    <div
      className={boxClass}
      style={{ maxHeight: growWithContent ? "none" : maxHeight, minHeight: growWithContent ? 80 : undefined }}
    >
      <div className="overflow-auto p-2">
        <CodeBlock
          code={resolvedContent}
          language={getLanguageFromFilename(filename)}
          className="rounded-lg border-0 text-sm"
        />
      </div>
    </div>
  );
}
