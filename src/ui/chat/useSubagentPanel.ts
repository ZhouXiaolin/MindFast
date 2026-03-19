import { useCallback, useEffect, useRef, useState } from "react";
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
  const prevTaskCountRef = useRef(0);

  // 有 subagent 任务时自动打开右侧边栏（从 0 变为有任务时打开）
  useEffect(() => {
    const n = tasks.length;
    if (prevTaskCountRef.current === 0 && n > 0) {
      setShowSubagentsPanel(true);
    }
    prevTaskCountRef.current = n;
  }, [tasks.length]);

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
