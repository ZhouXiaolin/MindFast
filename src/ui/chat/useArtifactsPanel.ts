import { useCallback, useEffect, useState } from "react";
import type { Artifact } from "../../ai/artifacts/types";

interface UseArtifactsPanelResult {
  activeArtifact: string | null;
  closePanel: () => void;
  hasArtifacts: boolean;
  openArtifact: (filename: string) => void;
  openPanel: () => void;
  selectedArtifact: Artifact | null;
  selectedFilename: string | null;
  selectArtifact: (filename: string) => void;
  showArtifactsPanel: boolean;
}

export function useArtifactsPanel(artifactsList: Artifact[]): UseArtifactsPanelResult {
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const [showArtifactsPanel, setShowArtifactsPanel] = useState(true);

  useEffect(() => {
    if (artifactsList.length === 0) {
      setActiveArtifact(null);
      return;
    }

    if (!activeArtifact || !artifactsList.some((artifact) => artifact.filename === activeArtifact)) {
      setActiveArtifact(artifactsList[artifactsList.length - 1]?.filename ?? null);
    }
  }, [activeArtifact, artifactsList]);

  const openArtifact = useCallback((filename: string) => {
    setActiveArtifact(filename);
    setShowArtifactsPanel(true);
  }, []);

  const selectArtifact = useCallback((filename: string) => {
    setActiveArtifact(filename);
  }, []);

  const openPanel = useCallback(() => {
    setShowArtifactsPanel(true);
  }, []);

  const closePanel = useCallback(() => {
    setShowArtifactsPanel(false);
  }, []);

  const selectedArtifact = activeArtifact
    ? artifactsList.find((artifact) => artifact.filename === activeArtifact) ?? null
    : artifactsList[artifactsList.length - 1] ?? null;

  return {
    activeArtifact,
    closePanel,
    hasArtifacts: artifactsList.length > 0,
    openArtifact,
    openPanel,
    selectedArtifact,
    selectedFilename: selectedArtifact?.filename ?? null,
    selectArtifact,
    showArtifactsPanel,
  };
}
