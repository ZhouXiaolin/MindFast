import { useCallback, useEffect, useRef, useState } from "react";
import type { Agent, AgentMessage, ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { Model } from "@mariozechner/pi-ai";
import type { ArtifactsStore } from "../../ai/artifacts/store";
import type { Artifact } from "../../ai/artifacts/types";
import { getInitializedAppStorage, initApp } from "../../init";
import { initializeSubtaskRuntime } from "../../ai/subtasks-runtime";
import { getDefaultModel } from "../../ai/agent";

interface ChatRuntimeState {
  agent: Agent | null;
  currentModel: Model<any> | null;
  thinkingLevel: ThinkingLevel;
  messages: AgentMessage[];
  streamMessage: AgentMessage | null;
  isStreaming: boolean;
  artifactsList: Artifact[];
}

interface UseChatRuntimeResult extends ChatRuntimeState {
  isHydratingRef: React.MutableRefObject<boolean>;
  isSessionReady: () => boolean;
  syncAgentState: (nextAgent: Agent, store?: ArtifactsStore | null) => void;
}

function cloneStreamMessage(message: AgentMessage | null): AgentMessage | null {
  if (!message) {
    return null;
  }
  return JSON.parse(JSON.stringify(message)) as AgentMessage;
}

const INITIAL_RUNTIME_STATE: ChatRuntimeState = {
  agent: null,
  currentModel: null,
  thinkingLevel: "off",
  messages: [],
  streamMessage: null,
  isStreaming: false,
  artifactsList: [],
};

export function useChatRuntime(sessionId: string): UseChatRuntimeResult {
  const [runtimeState, setRuntimeState] = useState<ChatRuntimeState>(INITIAL_RUNTIME_STATE);
  const artifactsStoreRef = useRef<ArtifactsStore | null>(null);
  const hydratedSessionRef = useRef<string | null>(null);
  const isHydratingRef = useRef(false);

  const syncAgentState = useCallback((nextAgent: Agent, store?: ArtifactsStore | null) => {
    const nextStore = store ?? artifactsStoreRef.current;
    nextStore?.reconstructFromMessages(nextAgent.state.messages);
    setRuntimeState((state) => ({
      ...state,
      currentModel: nextAgent.state.model ?? null,
      thinkingLevel: nextAgent.state.thinkingLevel ?? "off",
      messages: nextAgent.state.messages.slice(),
      streamMessage: cloneStreamMessage(nextAgent.state.streamMessage ?? null),
      isStreaming: nextAgent.state.isStreaming,
    }));
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void initApp()
      .then(({ agent, artifactsStore }) => {
        setRuntimeState((state) => ({ ...state, agent }));
        artifactsStoreRef.current = artifactsStore;
        syncAgentState(agent, artifactsStore);
        setRuntimeState((state) => ({
          ...state,
          artifactsList: artifactsStore.getSnapshot().map(([, artifact]) => artifact),
        }));
        artifactsStore.onChange = () => {
          setRuntimeState((state) => ({
            ...state,
            artifactsList: artifactsStore.getSnapshot().map(([, artifact]) => artifact),
          }));
        };
        unsubscribe = agent.subscribe(() => {
          syncAgentState(agent, artifactsStore);
        });
      })
      .catch((error) => {
        console.error("Failed to initialize chat runtime:", error);
      });

    return () => {
      unsubscribe?.();
      if (artifactsStoreRef.current) {
        artifactsStoreRef.current.onChange = null;
        artifactsStoreRef.current = null;
      }
    };
  }, [syncAgentState]);

  useEffect(() => {
    const { agent } = runtimeState;
    if (!agent || hydratedSessionRef.current === sessionId) {
      return;
    }

    let cancelled = false;

    const hydrateSession = async () => {
      try {
        isHydratingRef.current = true;
        const storage = await getInitializedAppStorage();
        const savedSession = await storage.sessions.loadSession(sessionId);

        if (cancelled) {
          return;
        }

        agent.abort();
        agent.reset();
        agent.sessionId = sessionId;

        if (savedSession) {
          agent.setModel(savedSession.model);
          agent.setThinkingLevel(savedSession.thinkingLevel);
          agent.replaceMessages(savedSession.messages);
        } else {
          // New session: reload the default model from user config
          const defaultModel = await getDefaultModel(storage);
          agent.setModel(defaultModel);
          agent.setThinkingLevel("off");
          agent.replaceMessages([]);
        }

        // Initialize subtask runtime with the session ID
        await initializeSubtaskRuntime(sessionId, storage.subtaskRuns);

        hydratedSessionRef.current = sessionId;
        syncAgentState(agent);
      } catch (error) {
        console.error("Failed to hydrate chat session:", error);
      } finally {
        isHydratingRef.current = false;
      }
    };

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [runtimeState.agent, sessionId, syncAgentState]);

  const isSessionReady = useCallback(() => {
    return hydratedSessionRef.current === sessionId && !isHydratingRef.current;
  }, [sessionId]);

  return {
    ...runtimeState,
    isHydratingRef,
    isSessionReady,
    syncAgentState,
  };
}
