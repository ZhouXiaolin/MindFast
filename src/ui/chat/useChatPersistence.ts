import { useEffect } from "react";
import type { Agent, AgentMessage } from "@mariozechner/pi-agent-core";
import { getInitializedAppStorage } from "../../init";
import { buildSessionMetadata } from "../../utils/workspace";

interface UseChatPersistenceParams {
  agent: Agent | null;
  isHydratingRef: React.MutableRefObject<boolean>;
  messages: AgentMessage[];
  sessionId: string;
  touchWorkspaceRevision: () => void;
}

export function useChatPersistence({
  agent,
  isHydratingRef,
  messages,
  sessionId,
  touchWorkspaceRevision,
}: UseChatPersistenceParams): void {
  useEffect(() => {
    if (!agent) {
      return;
    }
    if (agent.sessionId !== sessionId) {
      return;
    }
    if (isHydratingRef.current) {
      return;
    }
    if (messages.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const storage = await getInitializedAppStorage();
        const existingMetadata = await storage.sessions.getMetadata(sessionId);
        const metadata = buildSessionMetadata(sessionId, agent.state, existingMetadata);
        await storage.sessions.saveSession(sessionId, agent.state, metadata, metadata.title);
        touchWorkspaceRevision();
      } catch (error) {
        console.error("Failed to persist chat session:", error);
      }
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [agent, isHydratingRef, messages, sessionId, touchWorkspaceRevision]);
}
