import { cn } from "../../utils/cn";
import { ArtifactPreview } from "../artifacts/ArtifactPreview";
import type { ArtifactPanelItem } from "./useArtifactsPanel";

interface ChatArtifactsPanelProps {
  artifactsList: ArtifactPanelItem[];
  selectedArtifact: ArtifactPanelItem["artifact"] | null;
  selectedArtifactId: string | null;
  showArtifactsPanel: boolean;
  onClosePanel: () => void;
  onOpenPanel: () => void;
  onSelectArtifact: (artifactId: string) => void;
}

export function ChatArtifactsPanel({
  artifactsList,
  selectedArtifact,
  selectedArtifactId,
  showArtifactsPanel,
  onClosePanel,
  onOpenPanel,
  onSelectArtifact,
}: ChatArtifactsPanelProps) {
  if (artifactsList.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "min-h-0 border-l border-sidebar-soft bg-sidebar-panel backdrop-blur-sm",
          showArtifactsPanel ? "flex w-[min(44rem,48vw)] shrink-0 flex-col" : "hidden"
        )}
        style={{ minHeight: 0 }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sidebar-soft px-4 py-3">
          <div>
            <div className="text-sm font-medium text-sidebar">Artifacts</div>
            <div className="mt-1 text-xs text-sidebar-muted">
              Sandbox preview for HTML, styled preview for Markdown.
            </div>
          </div>
          <button
            type="button"
            onClick={onClosePanel}
            className="rounded-full p-2 text-sidebar-muted transition-colors hover:bg-sidebar-panel-strong hover:text-sidebar"
            aria-label="Close artifacts"
          >
            ×
          </button>
        </div>
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-sidebar-soft px-4 py-3">
          {artifactsList.map((artifact) => (
            <button
              key={artifact.id}
              type="button"
              onClick={() => onSelectArtifact(artifact.id)}
              title={artifact.label}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-mono whitespace-nowrap transition-colors",
                selectedArtifactId === artifact.id
                  ? "border-accent/30 bg-accent/10 text-sidebar"
                  : "border-sidebar-soft bg-sidebar-panel text-sidebar-muted hover:bg-sidebar-panel-strong hover:text-sidebar"
              )}
            >
              {artifact.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {selectedArtifact ? (
            <ArtifactPreview
              filename={selectedArtifact.filename}
              content={selectedArtifact.content}
            />
          ) : null}
        </div>
      </div>

      {!showArtifactsPanel ? (
        <button
          type="button"
          onClick={onOpenPanel}
          className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-sidebar-soft bg-sidebar-panel px-3 py-1.5 text-xs text-sidebar shadow-lg transition-colors hover:bg-sidebar-panel-strong"
          title="Show artifacts"
        >
          Artifacts ({artifactsList.length})
        </button>
      ) : null}
    </>
  );
}
