import { useCallback, useEffect, useRef, useState } from "react";
import type { SubtaskWithResult } from "../../ai/subagent-types";

interface UseSubagentPanelOptions {
  autoOpenEnabled?: boolean;
  resetKey?: string;
}

interface UseSubagentPanelResult {
  showSubagentsPanel: boolean;
  selectedTaskId: string | null;
  selectedTask: SubtaskWithResult | null;
  openPanel: (id?: string) => void;
  closePanel: () => void;
  selectTask: (id: string) => void;
}

export function useSubagentPanel(
  tasks: SubtaskWithResult[],
  options: UseSubagentPanelOptions = {}
): UseSubagentPanelResult {
  const { autoOpenEnabled = true, resetKey } = options;
  const [showSubagentsPanel, setShowSubagentsPanel] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const prevTaskCountRef = useRef(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    hasInitializedRef.current = false;
    prevTaskCountRef.current = 0;
    setShowSubagentsPanel(false);
    setSelectedTaskId(null);
  }, [resetKey]);

  useEffect(() => {
    const n = tasks.length;

    if (!autoOpenEnabled) {
      prevTaskCountRef.current = n;
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevTaskCountRef.current = n;
      return;
    }

    if (n > prevTaskCountRef.current) {
      setShowSubagentsPanel(true);
    }

    prevTaskCountRef.current = n;
  }, [autoOpenEnabled, tasks.length]);

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.runKey === selectedTaskId) ?? null
    : null;

  const openPanel = useCallback((id?: string) => {
    if (id) setSelectedTaskId(id);
    setShowSubagentsPanel(true);
  }, []);

  const closePanel = useCallback(() => {
    setShowSubagentsPanel(false);
  }, []);

  const selectTask = useCallback((id: string) => {
    setSelectedTaskId(id);
    setShowSubagentsPanel(true);
  }, []);

  return {
    showSubagentsPanel,
    selectedTaskId,
    selectedTask,
    openPanel,
    closePanel,
    selectTask,
  };
}
