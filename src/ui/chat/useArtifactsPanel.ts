import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceFile } from "../../ai/workspace/types";

export interface ArtifactPanelItem {
  id: string;
  artifact: WorkspaceFile;
  label: string;
}

interface UseArtifactsPanelOptions {
  autoOpenEnabled?: boolean;
  resetKey?: string;
}

interface UseArtifactsPanelResult {
  activeArtifact: string | null;
  closePanel: () => void;
  hasArtifacts: boolean;
  openArtifact: (filename: string) => void;
  openPanel: () => void;
  selectedArtifact: WorkspaceFile | null;
  selectedArtifactId: string | null;
  selectArtifact: (artifactId: string) => void;
  showArtifactsPanel: boolean;
  visibleArtifactsList: ArtifactPanelItem[];
}

export function useArtifactsPanel(
  defaultArtifactsList: ArtifactPanelItem[],
  lookupArtifactsList: ArtifactPanelItem[] = defaultArtifactsList,
  options: UseArtifactsPanelOptions = {}
): UseArtifactsPanelResult {
  const { autoOpenEnabled = true, resetKey } = options;
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const [focusedFilename, setFocusedFilename] = useState<string | null>(null);
  const [showArtifactsPanel, setShowArtifactsPanel] = useState(false);
  const prevArtifactCountRef = useRef(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    hasInitializedRef.current = false;
    prevArtifactCountRef.current = 0;
    setActiveArtifact(null);
    setFocusedFilename(null);
    setShowArtifactsPanel(false);
  }, [resetKey]);

  const visibleArtifactsList = focusedFilename
    ? lookupArtifactsList.filter((artifact) => {
        return artifact.artifact.filename === focusedFilename;
      })
    : defaultArtifactsList;

  const fallbackArtifact = visibleArtifactsList[visibleArtifactsList.length - 1] ?? null;
  const activeArtifactExists = !!activeArtifact &&
    visibleArtifactsList.some((artifact) => artifact.id === activeArtifact);
  const selectedArtifactId = activeArtifactExists
    ? activeArtifact
    : fallbackArtifact?.id ?? null;

  const openArtifact = useCallback((filename: string) => {
    const matchedArtifact = lookupArtifactsList.find(
      (artifact) => artifact.artifact.filename === filename
    );
    const nextArtifactId = matchedArtifact?.id ?? null;
    if (!nextArtifactId) {
      return;
    }
    setFocusedFilename(filename);
    setActiveArtifact(nextArtifactId);
    setShowArtifactsPanel(true);
  }, [lookupArtifactsList]);

  const selectArtifact = useCallback((artifactId: string) => {
    setActiveArtifact(artifactId);
  }, []);

  const openPanel = useCallback(() => {
    setFocusedFilename(null);
    setShowArtifactsPanel(true);
  }, []);

  const closePanel = useCallback(() => {
    setShowArtifactsPanel(false);
  }, []);

  const selectedArtifact = selectedArtifactId
    ? visibleArtifactsList.find((artifact) => artifact.id === selectedArtifactId)?.artifact ?? null
    : null;

  useEffect(() => {
    const nextCount = visibleArtifactsList.length;

    if (!autoOpenEnabled) {
      prevArtifactCountRef.current = nextCount;
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevArtifactCountRef.current = nextCount;
      return;
    }

    if (nextCount > prevArtifactCountRef.current && fallbackArtifact) {
      setActiveArtifact(fallbackArtifact.id);
      setShowArtifactsPanel(true);
    }

    prevArtifactCountRef.current = nextCount;
  }, [autoOpenEnabled, fallbackArtifact, visibleArtifactsList]);

  useEffect(() => {
    if (focusedFilename && visibleArtifactsList.length === 0) {
      setFocusedFilename(null);
    }
  }, [focusedFilename, visibleArtifactsList]);

  return {
    activeArtifact: selectedArtifactId,
    closePanel,
    hasArtifacts: visibleArtifactsList.length > 0 || defaultArtifactsList.length > 0,
    openArtifact,
    openPanel,
    selectedArtifact,
    selectedArtifactId,
    selectArtifact,
    showArtifactsPanel,
    visibleArtifactsList,
  };
}
