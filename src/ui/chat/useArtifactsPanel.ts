import { useCallback, useState } from "react";
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

  const fallbackArtifact = artifactsList[artifactsList.length - 1] ?? null;
  const activeArtifactExists = !!activeArtifact &&
    artifactsList.some((artifact) => artifact.filename === activeArtifact);
  const selectedFilename = activeArtifactExists
    ? activeArtifact
    : fallbackArtifact?.filename ?? null;

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

  const selectedArtifact = selectedFilename
    ? artifactsList.find((artifact) => artifact.filename === selectedFilename) ?? null
    : null;

  return {
    activeArtifact: selectedFilename,
    closePanel,
    hasArtifacts: artifactsList.length > 0,
    openArtifact,
    openPanel,
    selectedArtifact,
    selectedFilename,
    selectArtifact,
    showArtifactsPanel,
  };
}
