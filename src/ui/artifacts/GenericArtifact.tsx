import { Download, FileQuestion } from "lucide-react";
import type { ArtifactRendererProps } from "./types";
import { decodeBase64, downloadBlob } from "./base64-utils";

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf", zip: "application/zip", tar: "application/x-tar",
    gz: "application/gzip", mp3: "audio/mpeg", mp4: "video/mp4",
    wav: "audio/wav", json: "application/json", xml: "application/xml",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

export function GenericArtifact({ filename, content }: ArtifactRendererProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-sidebar-soft px-3 py-2">
        <button type="button" onClick={() => downloadBlob(decodeBase64(content), filename, getMimeType(filename))} className="rounded-md p-1 text-sidebar-muted hover:text-sidebar" title="Download">
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center max-w-md">
          <FileQuestion className="mx-auto mb-4 h-16 w-16 text-sidebar-muted/50" />
          <div className="font-medium text-sidebar mb-2">{filename}</div>
          <p className="text-sm text-sidebar-muted">
            Preview not available for this file type. Click the download button above to view it.
          </p>
        </div>
      </div>
    </div>
  );
}
