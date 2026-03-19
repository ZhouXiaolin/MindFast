import type { SubtaskRun } from "./subagent-types";
import type { SubtaskRunsStore } from "../stores/storage/stores/subtask-runs-store";

type Listener = () => void;

const subtaskRuns = new Map<string, SubtaskRun>();
const listeners = new Set<Listener>();
let snapshot: Map<string, SubtaskRun> = new Map();

// Persistence state
let currentSessionId: string | null = null;
let subtaskRunsStore: SubtaskRunsStore | null = null;
let flushScheduled = false;
let persistTimeout: ReturnType<typeof setTimeout> | null = null;

const PERSIST_DELAY_MS = 300; // Batch updates within 300ms

function emit() {
	snapshot = new Map(subtaskRuns);
	for (const listener of listeners) {
		listener();
	}

	// Schedule persistence if we have a session
	if (currentSessionId && subtaskRunsStore && !flushScheduled) {
		flushScheduled = true;
		persistTimeout = setTimeout(() => {
			void flushToStorage();
		}, PERSIST_DELAY_MS);
	}
}

async function flushToStorage() {
	flushScheduled = false;
	if (!currentSessionId || !subtaskRunsStore) return;

	try {
		const runsObj: Record<string, SubtaskRun> = {};
		for (const [id, run] of subtaskRuns) {
			runsObj[id] = run;
		}
		await subtaskRunsStore.saveSessionRuns(currentSessionId, runsObj);
	} catch (error) {
		console.error("Failed to persist subtask runs:", error);
	}
}

/**
 * Initialize the subtask runtime with a session ID and storage.
 * Call this when switching sessions or on app start.
 */
export async function initializeSubtaskRuntime(
	sessionId: string,
	store: SubtaskRunsStore
): Promise<void> {
	// Flush any pending changes for previous session
	if (persistTimeout) {
		clearTimeout(persistTimeout);
		persistTimeout = null;
	}
	if (flushScheduled) {
		await flushToStorage();
	}

	// Clear in-memory state
	subtaskRuns.clear();
	currentSessionId = sessionId;
	subtaskRunsStore = store;

	// Load runs from storage for this session
	const runsObj = await store.getSessionRuns(sessionId);
	if (runsObj) {
		for (const [id, run] of Object.entries(runsObj)) {
			subtaskRuns.set(id, run);
		}
	}

	// Notify listeners after loading
	snapshot = new Map(subtaskRuns);
	for (const listener of listeners) {
		listener();
	}
}

/**
 * Load subtask runs from storage for a session without changing the current session.
 * Returns the runs as a Map.
 */
export async function loadSubtaskRuns(
	sessionId: string,
	store: SubtaskRunsStore
): Promise<Map<string, SubtaskRun>> {
	const runsObj = await store.getSessionRuns(sessionId);
	const runs = new Map<string, SubtaskRun>();
	if (runsObj) {
		for (const [id, run] of Object.entries(runsObj)) {
			runs.set(id, run);
		}
	}
	return runs;
}

/**
 * Clear the runtime state (e.g., on logout or clear all data).
 */
export async function clearSubtaskRuntime(): Promise<void> {
	if (persistTimeout) {
		clearTimeout(persistTimeout);
		persistTimeout = null;
	}
	if (flushScheduled) {
		await flushToStorage();
	}

	subtaskRuns.clear();
	currentSessionId = null;
	subtaskRunsStore = null;
	snapshot = new Map();
	emit();
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

/**
 * Get the current session ID.
 */
export function getCurrentSessionId(): string | null {
	return currentSessionId;
}
