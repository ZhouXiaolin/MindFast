import { useEffect, useState, useRef, useCallback } from "react";
import type { Agent, AgentMessage, ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { Model, ToolResultMessage } from "@mariozechner/pi-ai";
import type { ArtifactsStore } from "../pi/artifacts/store";
import { initPi, createCustomModelSelector, getAgent, getAppStorage } from "../pi/initPi";
import { formatUsage, type Usage } from "../lib/format";
import { MessageList } from "./chat/MessageList";
import { StreamingMessageContainer } from "./chat/StreamingMessageContainer";
import { MessageEditor } from "./chat/MessageEditor";
import { cn } from "../lib/cn";
import { ArtifactPreview } from "./artifacts/ArtifactPreview";
import type { Artifact } from "../pi/artifacts/types";
import { buildSessionMetadata } from "../lib/workspace";
import { useAppStore } from "../stores/appStore";

interface ChatUIProps {
  sessionId: string;
}

const CHAT_FONT_CLASS: Record<import("../stores/appStore").ChatFont, string> = {
  default: "font-chat-default",
  sans: "font-chat-sans",
  system: "font-chat-system",
  dyslexic: "font-chat-dyslexic",
};

export function ChatUI({ sessionId }: ChatUIProps) {
  const touchWorkspaceRevision = useAppStore((state) => state.touchWorkspaceRevision);
  const chatFont = useAppStore((state) => state.chatFont);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [currentModel, setCurrentModel] = useState<Model<any> | null>(null);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("off");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [streamMessage, setStreamMessage] = useState<AgentMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [artifactsList, setArtifactsList] = useState<Artifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const [showArtifactsPanel, setShowArtifactsPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const artifactsStoreRef = useRef<ArtifactsStore | null>(null);
  const autoScrollRef = useRef(true);
  const hydratedSessionRef = useRef<string | null>(null);
  const isHydratingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (!autoScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const cloneStreamMessage = useCallback((message: AgentMessage | null) => {
    if (!message) {
      return null;
    }
    return JSON.parse(JSON.stringify(message)) as AgentMessage;
  }, []);

  const syncAgentState = useCallback((nextAgent: Agent, store?: ArtifactsStore | null) => {
    setCurrentModel(nextAgent.state.model ?? null);
    setThinkingLevel(nextAgent.state.thinkingLevel ?? "off");
    setMessages(nextAgent.state.messages.slice());
    setStreamMessage(cloneStreamMessage(nextAgent.state.streamMessage ?? null));
    setIsStreaming(nextAgent.state.isStreaming);
    (store ?? artifactsStoreRef.current)?.reconstructFromMessages(nextAgent.state.messages);
  }, [cloneStreamMessage]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    initPi()
      .then(({ agent: a, artifactsStore: store }) => {
        setAgent(a);
        artifactsStoreRef.current = store;
        syncAgentState(a, store);
        setArtifactsList(store.getSnapshot().map(([, artifact]) => artifact));
        store.onChange = () => {
          setArtifactsList(store.getSnapshot().map(([, artifact]) => artifact));
        };
        unsubscribe = a.subscribe(() => {
          syncAgentState(a, store);
        });
      })
      .catch(console.error);
    return () => {
      unsubscribe?.();
      if (artifactsStoreRef.current) {
        artifactsStoreRef.current.onChange = null;
        artifactsStoreRef.current = null;
      }
    };
  }, [syncAgentState]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamMessage, scrollToBottom]);

  useEffect(() => {
    if (!agent || hydratedSessionRef.current === sessionId) return;

    let cancelled = false;

    const hydrateSession = async () => {
      try {
        isHydratingRef.current = true;
        const storage = getAppStorage();
        const savedSession = storage
          ? await storage.sessions.loadSession(sessionId)
          : null;

        if (cancelled) return;

        agent.abort();
        agent.reset();
        agent.sessionId = sessionId;

        if (savedSession) {
          agent.setModel(savedSession.model);
          agent.setThinkingLevel(savedSession.thinkingLevel);
          agent.replaceMessages(savedSession.messages);
        } else {
          agent.replaceMessages([]);
        }

        hydratedSessionRef.current = sessionId;
        syncAgentState(agent);
      } catch (error) {
        console.error("Failed to hydrate chat session:", error);
      } finally {
        isHydratingRef.current = false;
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [agent, sessionId, syncAgentState]);

  useEffect(() => {
    if (artifactsList.length === 0) {
      setActiveArtifact(null);
      return;
    }

    if (!activeArtifact || !artifactsList.some((artifact) => artifact.filename === activeArtifact)) {
      setActiveArtifact(artifactsList[artifactsList.length - 1]?.filename ?? null);
    }
  }, [activeArtifact, artifactsList]);

  const handleSend = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !agent || isStreaming) return;
      if (hydratedSessionRef.current !== sessionId) return;
      setInput("");
      autoScrollRef.current = true;
      try {
        await agent.prompt(t);
      } catch (err) {
        console.error(err);
      }
    },
    [agent, isStreaming, sessionId]
  );

  useEffect(() => {
    if (!agent) return;
    if (hydratedSessionRef.current !== sessionId) return;
    if (isHydratingRef.current) return;
    if (messages.length === 0) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        const storage = getAppStorage();
        if (!storage) return;

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
  }, [agent, messages, sessionId, touchWorkspaceRevision]);

  const handleModelSelect = useCallback(() => {
    const a = getAgent();
    if (!a?.state?.model) return;
    const dialog = createCustomModelSelector(a.state.model, (model) => {
      a.setModel(model);
      syncAgentState(a);
    });
    document.body.appendChild(dialog);
  }, [syncAgentState]);

  const handleOpenArtifact = useCallback((filename: string) => {
    setActiveArtifact(filename);
    setShowArtifactsPanel(true);
  }, []);

  const toolResultsById = useRef(new Map<string, ToolResultMessage>()).current;
  toolResultsById.clear();
  for (const m of messages) {
    if (m.role === "toolResult") {
      const tr = m as ToolResultMessage & { toolCallId: string };
      toolResultsById.set(tr.toolCallId, m as ToolResultMessage);
    }
  }

  const tools = agent?.state.tools ?? [];
  const pendingToolCalls = agent?.state.pendingToolCalls ?? new Set<string>();

  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let totalCost = 0;
  for (const m of messages) {
    if (m.role === "assistant") {
      const u = (m as { usage?: Usage }).usage;
      if (u) {
        totalInput += u.input ?? 0;
        totalOutput += u.output ?? 0;
        totalCacheRead += u.cacheRead ?? 0;
        totalCacheWrite += u.cacheWrite ?? 0;
        totalCost += u.cost?.total ?? 0;
      }
    }
  }
  const usageTotals: Usage = {
    input: totalInput || undefined,
    output: totalOutput || undefined,
    cacheRead: totalCacheRead || undefined,
    cacheWrite: totalCacheWrite || undefined,
    cost: totalCost ? { total: totalCost } : undefined,
  };
  const hasUsage = totalInput + totalOutput + totalCacheRead + totalCacheWrite > 0;
  const usageText = hasUsage ? formatUsage(usageTotals) : "";

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center text-sidebar-muted">
        Loading…
      </div>
    );
  }

  const hasArtifacts = artifactsList.length > 0;
  const selectedArtifact = activeArtifact
    ? artifactsList.find((artifact) => artifact.filename === activeArtifact) ?? null
    : artifactsList[artifactsList.length - 1] ?? null;
  const selectedFilename = selectedArtifact?.filename ?? null;

  return (
    <div className="relative flex h-full flex-1 min-w-0">
      {/* Chat column */}
      <div
        className={cn("flex h-full flex-col flex-1 min-w-0", CHAT_FONT_CLASS[chatFont])}
        style={{ minHeight: 0 }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sidebar-soft px-4 py-3">
          <span className="text-sm text-sidebar-muted truncate">
            {currentModel?.name ?? "No model"}
          </span>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
          onScroll={() => {
            const el = scrollContainerRef.current;
            if (!el) return;
            const { scrollTop, scrollHeight, clientHeight } = el;
            const nearBottom = scrollHeight - scrollTop - clientHeight < 50;
            autoScrollRef.current = nearBottom;
          }}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-5 pb-2">
            {messages.length === 0 && !streamMessage && (
              <p className="py-8 text-center text-sm text-sidebar-muted">
                Send a message to start.
              </p>
            )}
            <MessageList
              messages={messages}
              tools={tools}
              pendingToolCalls={pendingToolCalls}
              isStreaming={isStreaming}
              onOpenArtifact={handleOpenArtifact}
            />
            {isStreaming && (
              <StreamingMessageContainer
                message={streamMessage}
                tools={tools}
                isStreaming={isStreaming}
                pendingToolCalls={pendingToolCalls}
                toolResultsById={toolResultsById}
                onOpenArtifact={handleOpenArtifact}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-sidebar-soft bg-sidebar-panel">
          <div className="max-w-3xl mx-auto px-2 pt-2">
            <MessageEditor
              value={input}
              onChange={setInput}
              isStreaming={isStreaming}
              currentModel={currentModel ?? undefined}
              thinkingLevel={thinkingLevel}
              onThinkingChange={(level) => {
                agent.setThinkingLevel(level);
                syncAgentState(agent);
              }}
              onSend={handleSend}
              onAbort={() => agent.abort()}
              onModelSelect={handleModelSelect}
              placeholder="Type a message…"
            />
            <div className="flex items-center justify-end h-5 py-1">
              {usageText ? (
                <span className="text-xs text-sidebar-muted">{usageText}</span>
              ) : (
                <span className="text-xs text-sidebar-muted">&nbsp;</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Artifacts panel */}
      {hasArtifacts && (
        <div
          className={cn(
            "min-h-0 border-l border-sidebar-soft bg-sidebar-panel backdrop-blur-sm",
            showArtifactsPanel ? "flex w-[min(44rem,48vw)] shrink-0 flex-col" : "hidden"
          )}
          style={{ minHeight: 0 }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-sidebar-soft px-4 py-3">
            <div>
              <div className="text-sm font-medium text-sidebar">Artifacts</div>
              <div className="mt-1 text-xs text-sidebar-muted">
                Sandbox preview for HTML, styled preview for Markdown.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowArtifactsPanel(false)}
              className="rounded-full p-2 text-sidebar-muted transition-colors hover:bg-sidebar-panel-strong hover:text-sidebar"
              aria-label="Close artifacts"
            >
              ×
            </button>
          </div>
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-sidebar-soft px-4 py-3">
            {artifactsList.map((artifact) => (
              <button
                key={artifact.filename}
                type="button"
                onClick={() => setActiveArtifact(artifact.filename)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-mono whitespace-nowrap transition-colors",
                  selectedFilename === artifact.filename
                    ? "border-accent/30 bg-accent/10 text-sidebar"
                    : "border-sidebar-soft bg-sidebar-panel text-sidebar-muted hover:bg-sidebar-panel-strong hover:text-sidebar"
                )}
              >
                {artifact.filename}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedArtifact ? (
              <ArtifactPreview
                filename={selectedArtifact.filename}
                content={selectedArtifact.content}
              />
            ) : null}
          </div>
        </div>
      )}

      {hasArtifacts && !showArtifactsPanel && (
        <button
          type="button"
          onClick={() => setShowArtifactsPanel(true)}
          className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-sidebar-soft bg-sidebar-panel px-3 py-1.5 text-xs text-sidebar shadow-lg transition-colors hover:bg-sidebar-panel-strong"
          title="Show artifacts"
        >
          Artifacts ({artifactsList.length})
        </button>
      )}
    </div>
  );
}
