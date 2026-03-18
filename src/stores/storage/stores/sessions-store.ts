import type { AgentState } from "@mariozechner/pi-agent-core";
import { Store } from "../store";
import type { SessionData, SessionMetadata, StoreConfig } from "../types";

export class SessionsStore extends Store {
	getConfig(): StoreConfig {
		return {
			name: "sessions",
			keyPath: "id",
			indices: [{ name: "lastModified", keyPath: "lastModified" }],
		};
	}

	static getMetadataConfig(): StoreConfig {
		return {
			name: "sessions-metadata",
			keyPath: "id",
			indices: [{ name: "lastModified", keyPath: "lastModified" }],
		};
	}

	async save(data: SessionData, metadata: SessionMetadata): Promise<void> {
		await this.getBackend().transaction(
			["sessions", "sessions-metadata"],
			"readwrite",
			async (tx) => {
				await tx.set("sessions", data.id, data);
				await tx.set("sessions-metadata", metadata.id, metadata);
			}
		);
	}

	async get(id: string): Promise<SessionData | null> {
		return this.getBackend().get<SessionData>("sessions", id);
	}

	async getMetadata(id: string): Promise<SessionMetadata | null> {
		return this.getBackend().get<SessionMetadata>("sessions-metadata", id);
	}

	async getAllMetadata(): Promise<SessionMetadata[]> {
		return this.getBackend().getAllFromIndex<SessionMetadata>(
			"sessions-metadata",
			"lastModified",
			"desc"
		);
	}

	async delete(id: string): Promise<void> {
		await this.getBackend().transaction(
			["sessions", "sessions-metadata"],
			"readwrite",
			async (tx) => {
				await tx.delete("sessions", id);
				await tx.delete("sessions-metadata", id);
			}
		);
	}

	async deleteSession(id: string): Promise<void> {
		return this.delete(id);
	}

	async updateTitle(id: string, title: string): Promise<void> {
		const metadata = await this.getMetadata(id);
		if (metadata) {
			metadata.title = title;
			await this.getBackend().set("sessions-metadata", id, metadata);
		}
		const data = await this.get(id);
		if (data) {
			data.title = title;
			await this.getBackend().set("sessions", id, data);
		}
	}

	async saveSession(
		id: string,
		state: AgentState,
		metadata?: SessionMetadata,
		title?: string
	): Promise<void> {
		const meta: SessionMetadata = metadata || {
			id,
			title: title || "",
			createdAt: new Date().toISOString(),
			lastModified: new Date().toISOString(),
			messageCount: state.messages?.length || 0,
			usage: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 0,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
			},
			thinkingLevel: state.thinkingLevel || "off",
			preview: "",
		};
		const data: SessionData = {
			id,
			title: title || meta.title,
			model: state.model,
			thinkingLevel: state.thinkingLevel,
			messages: state.messages || [],
			createdAt: meta.createdAt,
			lastModified: new Date().toISOString(),
		};
		await this.save(data, meta);
	}

	async loadSession(id: string): Promise<SessionData | null> {
		return this.get(id);
	}

	async getLatestSessionId(): Promise<string | null> {
		const allMetadata = await this.getAllMetadata();
		if (allMetadata.length === 0) return null;
		allMetadata.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
		return allMetadata[0].id;
	}
}
