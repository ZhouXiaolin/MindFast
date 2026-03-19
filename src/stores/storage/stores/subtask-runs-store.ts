import { Store } from "../store";
import type { StoreConfig } from "../types";
import type { SubtaskRun } from "../../../ai/subagent-types";

export interface SessionSubtaskRuns {
	sessionId: string;
	runs: Record<string, SubtaskRun>;
	lastModified: string;
}

export class SubtaskRunsStore extends Store {
	getConfig(): StoreConfig {
		return {
			name: "subtask-runs",
			keyPath: "sessionId",
			indices: [{ name: "lastModified", keyPath: "lastModified" }],
		};
	}

	async saveSessionRuns(sessionId: string, runs: Record<string, SubtaskRun>): Promise<void> {
		const data: SessionSubtaskRuns = {
			sessionId,
			runs,
			lastModified: new Date().toISOString(),
		};
		await this.getBackend().set("subtask-runs", sessionId, data);
	}

	async getSessionRuns(sessionId: string): Promise<Record<string, SubtaskRun> | null> {
		const data = await this.getBackend().get<SessionSubtaskRuns>("subtask-runs", sessionId);
		return data?.runs ?? null;
	}

	async deleteSessionRuns(sessionId: string): Promise<void> {
		await this.getBackend().delete("subtask-runs", sessionId);
	}

	async clearAll(): Promise<void> {
		await this.getBackend().clear("subtask-runs");
	}
}
