import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { Message } from "@mariozechner/pi-ai";

/**
 * Minimal convertToLlm: filter out UI-only messages (e.g. artifact) and pass through
 * user, assistant, toolResult. Used when not using pi-web-ui attachments/artifacts.
 */
export function defaultConvertToLlm(messages: AgentMessage[]): Message[] {
	return messages
		.filter((m) => (m as { role: string }).role !== "artifact")
		.filter((m): m is Message => {
			return m.role === "user" || m.role === "assistant" || m.role === "toolResult";
		}) as Message[];
}
