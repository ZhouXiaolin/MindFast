import { useCallback, useState } from "react";
import type { Artifact } from "../../ai/artifacts/types";

export interface ArtifactPanelItem {
  id: string;
  artifact: Artifact;
  kind: "main" | "subtask";
  label: string;
}

interface UseArtifactsPanelResult {
  activeArtifact: string | null;
  closePanel: () => void;
  hasArtifacts: boolean;
  openArtifact: (filename: string) => void;
  openPanel: () => void;
  selectedArtifact: Artifact | null;
  selectedArtifactId: string | null;
  selectArtifact: (artifactId: string) => void;
  showArtifactsPanel: boolean;
}

export function useArtifactsPanel(artifactsList: ArtifactPanelItem[]): UseArtifactsPanelResult {
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const [showArtifactsPanel, setShowArtifactsPanel] = useState(true);

  const fallbackArtifact = artifactsList[artifactsList.length - 1] ?? null;
  const activeArtifactExists = !!activeArtifact &&
    artifactsList.some((artifact) => artifact.id === activeArtifact);
  const selectedArtifactId = activeArtifactExists
    ? activeArtifact
    : fallbackArtifact?.id ?? null;

  const openArtifact = useCallback((filename: string) => {
    const mainMatch = artifactsList.find(
      (artifact) => artifact.kind === "main" && artifact.artifact.filename === filename
    );
    const fallbackMatch = artifactsList.find(
      (artifact) => artifact.artifact.filename === filename
    );
    setActiveArtifact(mainMatch?.id ?? fallbackMatch?.id ?? null);
    setShowArtifactsPanel(true);
  }, [artifactsList]);

  const selectArtifact = useCallback((artifactId: string) => {
    setActiveArtifact(artifactId);
  }, []);

  const openPanel = useCallback(() => {
    setShowArtifactsPanel(true);
  }, []);

  const closePanel = useCallback(() => {
    setShowArtifactsPanel(false);
  }, []);

  const selectedArtifact = selectedArtifactId
    ? artifactsList.find((artifact) => artifact.id === selectedArtifactId)?.artifact ?? null
    : null;

  return {
    activeArtifact: selectedArtifactId,
    closePanel,
    hasArtifacts: artifactsList.length > 0,
    openArtifact,
    openPanel,
    selectedArtifact,
    selectedArtifactId,
    selectArtifact,
    showArtifactsPanel,
  };
}
