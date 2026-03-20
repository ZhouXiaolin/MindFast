import type { ArtifactRendererProps } from "./types";
import { getFileType } from "./types";
import { HtmlArtifact } from "./HtmlArtifact";
import { SvgArtifact } from "./SvgArtifact";
import { MarkdownArtifact } from "./MarkdownArtifact";
import { ImageArtifact } from "./ImageArtifact";
import { PdfArtifact } from "./PdfArtifact";
import { DocxArtifact } from "./DocxArtifact";
import { ExcelArtifact } from "./ExcelArtifact";
import { JavaScriptArtifact } from "./JavaScriptArtifact";
import { PythonArtifact } from "./PythonArtifact";
import { TextArtifact } from "./TextArtifact";
import { GenericArtifact } from "./GenericArtifact";
import { useResolvedPreviewContent } from "../chat/LivePreviewContext";

const RENDERERS: Record<string, React.ComponentType<ArtifactRendererProps>> = {
  html: HtmlArtifact,
  svg: SvgArtifact,
  markdown: MarkdownArtifact,
  image: ImageArtifact,
  pdf: PdfArtifact,
  docx: DocxArtifact,
  excel: ExcelArtifact,
  javascript: JavaScriptArtifact,
  python: PythonArtifact,
  text: TextArtifact,
  generic: GenericArtifact,
};

export function ArtifactPreview({ filename, content }: ArtifactRendererProps) {
  const resolved = useResolvedPreviewContent(filename, content);
  const fileType = getFileType(filename);
  const Renderer = RENDERERS[fileType] || GenericArtifact;

  if (!resolved.content && resolved.statusText) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-sidebar-muted">
        {resolved.statusText}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {resolved.statusText ? (
        <div className="absolute right-3 top-3 z-10 rounded-full border border-sidebar-soft bg-sidebar-panel/90 px-2.5 py-1 text-xs text-sidebar-muted shadow-sm backdrop-blur-sm">
          {resolved.statusText}
        </div>
      ) : null}
      <Renderer filename={filename} content={resolved.content} />
    </div>
  );
}
