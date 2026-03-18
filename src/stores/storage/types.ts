import type { AgentMessage, ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { Model } from "@mariozechner/pi-ai";

export interface StorageTransaction {
	get<T = unknown>(storeName: string, key: string): Promise<T | null>;
	set<T = unknown>(storeName: string, key: string, value: T): Promise<void>;
	delete(storeName: string, key: string): Promise<void>;
}

export interface StorageBackend {
	get<T = unknown>(storeName: string, key: string): Promise<T | null>;
	set<T = unknown>(storeName: string, key: string, value: T): Promise<void>;
	delete(storeName: string, key: string): Promise<void>;
	keys(storeName: string, prefix?: string): Promise<string[]>;
	getAllFromIndex<T = unknown>(
		storeName: string,
		indexName: string,
		direction?: "asc" | "desc"
	): Promise<T[]>;
	clear(storeName: string): Promise<void>;
	has(storeName: string, key: string): Promise<boolean>;
	transaction<T>(
		storeNames: string[],
		mode: "readonly" | "readwrite",
		operation: (tx: StorageTransaction) => Promise<T>
	): Promise<T>;
	getQuotaInfo(): Promise<{ usage: number; quota: number; percent: number }>;
	requestPersistence(): Promise<boolean>;
}

export interface SessionMetadata {
	id: string;
	title: string;
	createdAt: string;
	lastModified: string;
	messageCount: number;
	usage: {
		input: number;
		output: number;
		cacheRead: number;
		cacheWrite: number;
		totalTokens: number;
		cost: {
			input: number;
			output: number;
			cacheRead: number;
			cacheWrite: number;
			total: number;
		};
	};
	thinkingLevel: ThinkingLevel;
	preview: string;
}

export interface SessionData {
	id: string;
	title: string;
	model: Model<any>;
	thinkingLevel: ThinkingLevel;
	messages: AgentMessage[];
	createdAt: string;
	lastModified: string;
}

export interface IndexedDBConfig {
	dbName: string;
	version: number;
	stores: StoreConfig[];
}

export interface StoreConfig {
	name: string;
	keyPath?: string;
	autoIncrement?: boolean;
	indices?: IndexConfig[];
}

export interface IndexConfig {
	name: string;
	keyPath: string;
	unique?: boolean;
}
