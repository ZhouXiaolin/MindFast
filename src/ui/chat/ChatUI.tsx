import { useEffect, useState, useRef, useCallback } from "react";
import type { Agent, AgentMessage, ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { Model, ToolResultMessage } from "@mariozechner/pi-ai";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import type { ArtifactsStore } from "../../ai/artifacts/store";
import { initApp, getAppStorage, getEnabledModels, getModelForProvider } from "../../init";
import { formatUsage, type Usage } from "../../utils/format";
import { MessageList } from "./MessageList";
import { StreamingMessageContainer } from "./StreamingMessageContainer";
import { MessageEditor } from "./MessageEditor";
import { cn } from "../../utils/cn";
import { ArtifactPreview } from "../../components/artifacts/ArtifactPreview";
import type { Artifact } from "../../ai/artifacts/types";
import { buildSessionMetadata } from "../../utils/workspace";
import { useAppStore } from "../../stores/app";

interface ChatUIProps {
  sessionId: string;
}

const CHAT_FONT_CLASS: Record<import("../../stores/app").ChatFont, string> = {
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
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [enabledModels, setEnabledModels] = useState<Array<{ providerId: string; modelId: string; name: string }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
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
    initApp()
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

  useEffect(() => {
    if (!modelMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!modelMenuRef.current?.contains(event.target as Node)) {
        setModelMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModelMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modelMenuOpen]);

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

  const handleEditUserMessage = useCallback((text: string) => {
    setInput(text);
    autoScrollRef.current = true;
    requestAnimationFrame(() => {
      composerTextareaRef.current?.focus();
      composerTextareaRef.current?.setSelectionRange(text.length, text.length);
      composerTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const handleRetryUserMessage = useCallback(
    async (messageIndex: number, text: string) => {
      const t = text.trim();
      if (!t || !agent || isStreaming) return;
      if (hydratedSessionRef.current !== sessionId) return;

      autoScrollRef.current = true;
      setInput("");

      try {
        agent.abort();
        agent.replaceMessages(messages.slice(0, messageIndex));
        syncAgentState(agent);
        await agent.prompt(t);
      } catch (error) {
        console.error(error);
      }
    },
    [agent, isStreaming, messages, sessionId, syncAgentState]
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

  const handleModelSelect = useCallback(async () => {
    if (!enabledModels.length && !isLoadingModels) {
      setIsLoadingModels(true);
      try {
        setEnabledModels(await getEnabledModels());
      } catch (error) {
        console.error("Failed to load enabled models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    }
    setModelMenuOpen((open) => !open);
  }, [enabledModels.length, isLoadingModels]);

  const handleSelectModelOption = useCallback(
    async (providerId: string, modelId: string) => {
      if (!agent) return;
      try {
        const model = await getModelForProvider(providerId, modelId);
        agent.setModel(model);
        syncAgentState(agent);
        setModelMenuOpen(false);
      } catch (error) {
        console.error("Failed to select model:", error);
      }
    },
    [agent, syncAgentState]
  );

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
  const isEmptyChat = messages.length === 0 && !streamMessage;
  const selectedArtifact = activeArtifact
    ? artifactsList.find((artifact) => artifact.filename === activeArtifact) ?? null
    : artifactsList[artifactsList.length - 1] ?? null;
  const selectedFilename = selectedArtifact?.filename ?? null;

  return (
    <div className="relative flex h-full flex-1 min-w-0">
      {/* Chat column */}
      <div
        className={cn("chat-column-shell flex h-full min-w-0 flex-1 flex-col", CHAT_FONT_CLASS[chatFont])}
        style={{ minHeight: 0 }}
      >
        <div className="chat-topbar flex shrink-0 items-center justify-between border-b border-sidebar-soft px-4 py-3">
          <div ref={modelMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                void handleModelSelect();
              }}
              className="inline-flex max-w-[min(26rem,72vw)] items-center gap-2 rounded-full bg-sidebar-panel px-3 py-1.5 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar"
              title={currentModel?.id ?? "No model"}
              aria-expanded={modelMenuOpen}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{currentModel?.id ?? "No model"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", modelMenuOpen && "rotate-180")} />
            </button>
            {modelMenuOpen ? (
              <div className="absolute left-0 top-full z-40 mt-2 w-[min(30rem,80vw)] overflow-hidden rounded-2xl border border-sidebar-soft bg-sidebar-panel-strong shadow-xl backdrop-blur-xl">
                <div className="border-b border-sidebar-soft px-3 py-2 text-xs uppercase tracking-[0.14em] text-sidebar-muted">
                  Select model
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {isLoadingModels ? (
                    <div className="px-3 py-3 text-sm text-sidebar-muted">Loading models…</div>
                  ) : enabledModels.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-sidebar-muted">No enabled models</div>
                  ) : (
                    enabledModels.map((modelOption) => {
                      const isCurrent =
                        currentModel?.provider === modelOption.providerId &&
                        currentModel?.id === modelOption.modelId;

                      return (
                        <button
                          key={`${modelOption.providerId}:${modelOption.modelId}`}
                          type="button"
                          onClick={() => {
                            void handleSelectModelOption(modelOption.providerId, modelOption.modelId);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            isCurrent
                              ? "bg-accent/10 text-sidebar"
                              : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{modelOption.modelId}</div>
                            <div className="mt-0.5 text-xs text-sidebar-muted">{modelOption.providerId}</div>
                          </div>
                          {isCurrent ? <Check className="h-4 w-4 shrink-0 text-accent" /> : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className={cn(
            "chat-scroll-region min-h-0 flex-1 overflow-y-auto",
            isEmptyChat && "flex"
          )}
          onScroll={() => {
            const el = scrollContainerRef.current;
            if (!el) return;
            const { scrollTop, scrollHeight, clientHeight } = el;
            const nearBottom = scrollHeight - scrollTop - clientHeight < 50;
            autoScrollRef.current = nearBottom;
          }}
        >
          {isEmptyChat ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-8">
              <div className="-translate-y-[10vh] w-full px-1 transition-transform sm:px-2">
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
                  placeholder="Type a message…"
                  textareaRef={composerTextareaRef}
                />
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-3">
              <div className="flex flex-col gap-5 px-1 py-3 sm:px-2">
                <MessageList
                  messages={messages}
                  tools={tools}
                  pendingToolCalls={pendingToolCalls}
                  isStreaming={isStreaming}
                  onOpenArtifact={handleOpenArtifact}
                  onEditUserMessage={handleEditUserMessage}
                  onRetryUserMessage={handleRetryUserMessage}
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
          )}
        </div>

        {!isEmptyChat ? (
          <div className="chat-composer-dock shrink-0 border-t border-sidebar-soft">
            <div className="mx-auto max-w-3xl px-4 pb-4 pt-3">
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
                placeholder="Type a message…"
                textareaRef={composerTextareaRef}
              />
              <div className="flex h-6 items-center justify-end px-2 py-1">
                {usageText ? (
                  <span className="text-xs text-sidebar-muted">{usageText}</span>
                ) : (
                  <span className="text-xs text-sidebar-muted">&nbsp;</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
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
