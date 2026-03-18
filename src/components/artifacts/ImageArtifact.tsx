import { Download } from "lucide-react";
import type { ArtifactRendererProps } from "./types";
import { decodeBase64, downloadBlob } from "./base64-utils";

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "bmp") return "image/bmp";
  if (ext === "ico") return "image/x-icon";
  return "image/png";
}

function getImageUrl(content: string, filename: string): string {
  if (content.startsWith("data:")) return content;
  return `data:${getMimeType(filename)};base64,${content}`;
}

export function ImageArtifact({ filename, content }: ArtifactRendererProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-sidebar-soft px-3 py-2">
        <button type="button" onClick={() => downloadBlob(decodeBase64(content), filename, getMimeType(filename))} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Download">
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 min-h-0 overflow-auto">
        <img src={getImageUrl(content, filename)} alt={filename} className="max-w-full max-h-full object-contain" />
      </div>
    </div>
  );
}
