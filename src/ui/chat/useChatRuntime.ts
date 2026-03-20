import { useCallback, useEffect, useRef, useState } from "react";
import type { Agent, AgentMessage, ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { Model } from "@mariozechner/pi-ai";
import type { WorkspaceStore } from "../../ai/workspace/store";
import type { WorkspaceFile } from "../../ai/workspace/types";
import { getInitializedAppStorage, initApp } from "../../init";
import { initializeSubtaskRuntime } from "../../ai/subtasks-runtime";
import { getDefaultModel } from "../../ai/agent";

interface ChatRuntimeState {
  agent: Agent | null;
  currentModel: Model<any> | null;
  sessionReady: boolean;
  thinkingLevel: ThinkingLevel;
  messages: AgentMessage[];
  streamMessage: AgentMessage | null;
  isStreaming: boolean;
  workspaceFiles: WorkspaceFile[];
}

interface UseChatRuntimeResult extends ChatRuntimeState {
  isHydratingRef: React.MutableRefObject<boolean>;
  syncAgentState: (
    nextAgent: Agent,
    store?: WorkspaceStore | null,
    options?: { reconstructWorkspace?: boolean }
  ) => void;
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
  sessionReady: false,
  thinkingLevel: "off",
  messages: [],
  streamMessage: null,
  isStreaming: false,
  workspaceFiles: [],
};

export function useChatRuntime(sessionId: string): UseChatRuntimeResult {
  const [runtimeState, setRuntimeState] = useState<ChatRuntimeState>(INITIAL_RUNTIME_STATE);
  const workspaceStoreRef = useRef<WorkspaceStore | null>(null);
  const hydratedSessionRef = useRef<string | null>(null);
  const isHydratingRef = useRef(false);

  const syncAgentState = useCallback((
    nextAgent: Agent,
    store?: WorkspaceStore | null,
    options?: { reconstructWorkspace?: boolean }
  ) => {
    const nextStore = store ?? workspaceStoreRef.current;
    if (options?.reconstructWorkspace) {
      nextStore?.reconstructFromMessages(nextAgent.state.messages);
    }
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
      .then(({ agent, workspaceStore }) => {
        setRuntimeState((state) => ({ ...state, agent }));
        workspaceStoreRef.current = workspaceStore;
        syncAgentState(agent, workspaceStore, { reconstructWorkspace: true });
        setRuntimeState((state) => ({
          ...state,
          workspaceFiles: workspaceStore.getSnapshot().map(([, file]) => file),
        }));
        workspaceStore.onChange = () => {
          setRuntimeState((state) => ({
            ...state,
            workspaceFiles: workspaceStore.getSnapshot().map(([, file]) => file),
          }));
        };
        unsubscribe = agent.subscribe(() => {
          syncAgentState(agent, workspaceStore);
        });
      })
      .catch((error) => {
        console.error("Failed to initialize chat runtime:", error);
      });

    return () => {
      unsubscribe?.();
      if (workspaceStoreRef.current) {
        workspaceStoreRef.current.onChange = null;
        workspaceStoreRef.current = null;
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
        setRuntimeState((state) => ({ ...state, sessionReady: false }));
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
        syncAgentState(agent, undefined, { reconstructWorkspace: true });
        if (!cancelled) {
          setRuntimeState((state) => ({ ...state, sessionReady: true }));
        }
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

  return {
    ...runtimeState,
    isHydratingRef,
    syncAgentState,
  };
}
