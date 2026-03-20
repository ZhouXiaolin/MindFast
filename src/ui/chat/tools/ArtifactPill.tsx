import { FileCode2 } from "lucide-react";
import { cn } from "../../../utils/cn";

interface ArtifactPillProps {
  filename: string;
  onOpen?: (filename: string) => void;
  interactive?: boolean;
}

export function ArtifactPill({
  filename,
  onOpen,
  interactive = true,
}: ArtifactPillProps) {
  const className = cn(
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
    onOpen && interactive
      ? "cursor-pointer border-sidebar-soft bg-sidebar-panel text-sidebar transition-colors hover:bg-sidebar-panel-strong"
      : "border-sidebar-soft bg-sidebar-panel text-sidebar"
  );

  if (!interactive) {
    return (
      <span className={className}>
        <FileCode2 className="h-3 w-3 shrink-0" />
        <span>{filename}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen?.(filename);
      }}
      className={className}
    >
      <FileCode2 className="h-3 w-3 shrink-0" />
      <span>{filename}</span>
    </button>
  );
}
