import { createContext, useContext, useMemo } from "react";
import type { SubtaskStatus } from "../../../ai/subagent-types";

interface SubagentToolContextValue {
	statusMap: Map<string, SubtaskStatus>;
	onSelectSubagent: (id: string) => void;
}

const SubagentToolContext = createContext<SubagentToolContextValue | null>(null);

export function SubagentToolProvider({
	children,
	statusMap,
	onSelectSubagent,
}: {
	children: React.ReactNode;
	statusMap: Map<string, SubtaskStatus>;
	onSelectSubagent: (id: string) => void;
}) {
	// Create a stable map reference to avoid unnecessary re-renders
	const stableStatusMap = useMemo(() => statusMap, [statusMap]);

	return (
		<SubagentToolContext.Provider value={{ statusMap: stableStatusMap, onSelectSubagent }}>
			{children}
		</SubagentToolContext.Provider>
	);
}

export function useSubagentToolContext(): SubagentToolContextValue {
	const context = useContext(SubagentToolContext);
	if (!context) {
		// Return default callbacks when context is not available
		return {
			statusMap: new Map(),
			onSelectSubagent: () => {},
		};
	}
	return context;
}

export function useSubtaskStatus(id: string): SubtaskStatus {
	const { statusMap } = useSubagentToolContext();
	return statusMap.get(id) ?? "pending";
}
