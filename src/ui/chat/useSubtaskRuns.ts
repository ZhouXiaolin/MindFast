import { useSyncExternalStore } from "react";
import { getSubtaskRunsSnapshot, subscribeSubtaskRuns } from "../../ai/subtasks-runtime";

export function useSubtaskRuns(): Map<string, import("../../ai/subagent-types").SubtaskRun> {
  return useSyncExternalStore(
    subscribeSubtaskRuns,
    getSubtaskRunsSnapshot,
    getSubtaskRunsSnapshot
  );
}
