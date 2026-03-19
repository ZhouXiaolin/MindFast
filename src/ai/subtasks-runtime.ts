import type { SubtaskRun } from "./subagent-types";

type Listener = () => void;

const subtaskRuns = new Map<string, SubtaskRun>();
const listeners = new Set<Listener>();
let snapshot: Map<string, SubtaskRun> = new Map();

function emit() {
  snapshot = new Map(subtaskRuns);
  for (const listener of listeners) {
    listener();
  }
}

export function upsertSubtaskRun(id: string, run: SubtaskRun): void {
  subtaskRuns.set(id, run);
  emit();
}

export function patchSubtaskRun(id: string, patch: Partial<SubtaskRun>): void {
  const current = subtaskRuns.get(id);
  if (!current) return;
  subtaskRuns.set(id, { ...current, ...patch });
  emit();
}

export function clearSubtaskRuns(ids?: string[]): void {
  if (ids && ids.length > 0) {
    for (const id of ids) {
      subtaskRuns.delete(id);
    }
  } else {
    subtaskRuns.clear();
  }
  emit();
}

export function getSubtaskRunsSnapshot(): Map<string, SubtaskRun> {
  return snapshot;
}

export function subscribeSubtaskRuns(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
