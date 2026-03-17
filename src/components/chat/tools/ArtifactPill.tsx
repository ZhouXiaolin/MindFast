import { FileCode2 } from "lucide-react";
import { cn } from "../../../lib/cn";

interface ArtifactPillProps {
  filename: string;
  onOpen?: (filename: string) => void;
}

export function ArtifactPill({ filename, onOpen }: ArtifactPillProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen?.(filename);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs",
        onOpen
          ? "cursor-pointer border-sidebar bg-sidebar-hover text-sidebar hover:opacity-90"
          : "border-sidebar bg-sidebar/50 text-sidebar"
      )}
    >
      <FileCode2 className="h-3 w-3 shrink-0" />
      <span>{filename}</span>
    </button>
  );
}
