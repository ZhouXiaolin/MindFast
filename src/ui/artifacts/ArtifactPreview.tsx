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
import { useResolvedArtifactContent } from "./ArtifactPreviewContext";

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
  const resolved = useResolvedArtifactContent(filename, content);
  const fileType = getFileType(filename);
  const Renderer = RENDERERS[fileType] || GenericArtifact;
  const rendererKey = resolved.refreshToken ?? filename;

  if (!resolved.content && resolved.statusText) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-sidebar-muted">
        {resolved.statusText}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <Renderer key={rendererKey} filename={filename} content={resolved.content} />
    </div>
  );
}
