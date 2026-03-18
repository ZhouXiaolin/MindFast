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
  const fileType = getFileType(filename);
  const Renderer = RENDERERS[fileType] || GenericArtifact;
  return <Renderer filename={filename} content={content} />;
}
