import { useCallback, useState } from "react";
import type { SubtaskWithResult } from "../../ai/subagent-types";

interface UseSubagentPanelResult {
  showSubagentsPanel: boolean;
  selectedTaskId: string | null;
  selectedTask: SubtaskWithResult | null;
  openPanel: (id?: string) => void;
  closePanel: () => void;
  selectTask: (id: string) => void;
}

export function useSubagentPanel(tasks: SubtaskWithResult[]): UseSubagentPanelResult {
  const [showSubagentsPanel, setShowSubagentsPanel] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) ?? null
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
