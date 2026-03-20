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
let lastPersistedSignature = "";

const PERSIST_DELAY_MS = 300; // Batch updates within 300ms

function shouldPersistRun(run: SubtaskRun): boolean {
	return !run.isStreaming;
}

function getPersistedRunsObject(): Record<string, SubtaskRun> {
	const runsObj: Record<string, SubtaskRun> = {};
	for (const [id, run] of subtaskRuns) {
		if (!shouldPersistRun(run)) continue;
		runsObj[id] = run;
	}
	return runsObj;
}

function getRunsSignature(runs: Record<string, SubtaskRun>): string {
	return JSON.stringify(runs);
}

function normalizeRun(runKey: string, run: SubtaskRun): SubtaskRun {
	return {
		...run,
		files: run.files.map((file, index) => ({
			...file,
			id: file.id ?? `subtask:${runKey}:${index}:${file.filename}`,
		})),
	};
}

function emit(schedulePersist = true) {
	snapshot = new Map(subtaskRuns);
	for (const listener of listeners) {
		listener();
	}

	// Schedule persistence if we have a session
	if (schedulePersist && currentSessionId && subtaskRunsStore && !flushScheduled) {
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
		const runsObj = getPersistedRunsObject();
		const nextSignature = getRunsSignature(runsObj);
		if (nextSignature === lastPersistedSignature) {
			return;
		}

		if (Object.keys(runsObj).length === 0) {
			await subtaskRunsStore.deleteSessionRuns(currentSessionId);
		} else {
			await subtaskRunsStore.saveSessionRuns(currentSessionId, runsObj);
		}
		lastPersistedSignature = nextSignature;
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
	lastPersistedSignature = "";

	// Load runs from storage for this session
	const runsObj = await store.getSessionRuns(sessionId);
	if (runsObj) {
		for (const [id, run] of Object.entries(runsObj)) {
			subtaskRuns.set(id, normalizeRun(id, run));
		}
		lastPersistedSignature = getRunsSignature(runsObj);
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
			runs.set(id, normalizeRun(id, run));
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
	lastPersistedSignature = "";
	snapshot = new Map();
	emit();
}

export function upsertSubtaskRun(id: string, run: SubtaskRun): void {
	const current = subtaskRuns.get(id);
	const shouldSchedulePersist = shouldPersistRun(run) || (current ? shouldPersistRun(current) : false);
	subtaskRuns.set(id, run);
	emit(shouldSchedulePersist);
}

export function patchSubtaskRun(id: string, patch: Partial<SubtaskRun>): void {
	const current = subtaskRuns.get(id);
	if (!current) return;
	const nextRun = { ...current, ...patch };
	const shouldSchedulePersist = shouldPersistRun(current) || shouldPersistRun(nextRun);
	subtaskRuns.set(id, nextRun);
	emit(shouldSchedulePersist);
}

export function clearSubtaskRuns(ids?: string[]): void {
	let shouldSchedulePersist = false;
	if (ids && ids.length > 0) {
		for (const id of ids) {
			const current = subtaskRuns.get(id);
			if (current && shouldPersistRun(current)) {
				shouldSchedulePersist = true;
			}
			subtaskRuns.delete(id);
		}
	} else {
		for (const run of subtaskRuns.values()) {
			if (shouldPersistRun(run)) {
				shouldSchedulePersist = true;
				break;
			}
		}
		subtaskRuns.clear();
	}
	emit(shouldSchedulePersist);
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
