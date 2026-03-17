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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
        onOpen
          ? "cursor-pointer border-sidebar-soft bg-sidebar-panel text-sidebar transition-colors hover:bg-sidebar-panel-strong"
          : "border-sidebar-soft bg-sidebar-panel text-sidebar"
      )}
    >
      <FileCode2 className="h-3 w-3 shrink-0" />
      <span>{filename}</span>
    </button>
  );
}
