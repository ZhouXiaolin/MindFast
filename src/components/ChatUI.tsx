import { useEffect, useState, useRef, useCallback } from "react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { Agent } from "@mariozechner/pi-agent-core";
import type { ToolResultMessage } from "@mariozechner/pi-ai";
import type { ArtifactsStore } from "../pi/artifacts/store";
import { initPi, createCustomModelSelector, getAgent } from "../pi/initPi";
import { formatUsage, type Usage } from "../lib/format";
import { MessageList } from "./chat/MessageList";
import { StreamingMessageContainer } from "./chat/StreamingMessageContainer";
import { MessageEditor } from "./chat/MessageEditor";
import { cn } from "../lib/cn";

export function ChatUI() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [streamMessage, setStreamMessage] = useState<AgentMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [artifactsList, setArtifactsList] = useState<Array<[string, { filename: string; content: string }]>>([]);
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const [showArtifactsPanel, setShowArtifactsPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const artifactsStoreRef = useRef<ArtifactsStore | null>(null);
  const autoScrollRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (!autoScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    initPi()
      .then(({ agent: a, artifactsStore: store }) => {
        setAgent(a);
        setMessages(a.state.messages);
        setStreamMessage(a.state.streamMessage ?? null);
        setIsStreaming(a.state.isStreaming);
        if (store) {
          artifactsStoreRef.current = store;
          store.reconstructFromMessages(a.state.messages);
          setArtifactsList(store.getSnapshot().map(([k, v]) => [k, { filename: v.filename, content: v.content }]));
          store.onChange = () => {
            setArtifactsList(store.getSnapshot().map(([k, v]) => [k, { filename: v.filename, content: v.content }]));
          };
        }
        unsubscribe = a.subscribe(() => {
          setMessages(a.state.messages);
          setStreamMessage(a.state.streamMessage ?? null);
          setIsStreaming(a.state.isStreaming);
          store?.reconstructFromMessages(a.state.messages);
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
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamMessage, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !agent || isStreaming) return;
      setInput("");
      autoScrollRef.current = true;
      try {
        await agent.prompt(t);
      } catch (err) {
        console.error(err);
      }
    },
    [agent, isStreaming]
  );

  const handleModelSelect = useCallback(() => {
    const a = getAgent();
    if (!a?.state?.model) return;
    const dialog = createCustomModelSelector(a.state.model, (model) => {
      a.setModel(model);
    });
    document.body.appendChild(dialog);
  }, []);

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
  const selectedContent = activeArtifact
    ? artifactsList.find(([k]) => k === activeArtifact)?.[1]?.content ?? ""
    : artifactsList[0]?.[1]?.content ?? "";
  const selectedFilename = activeArtifact ?? artifactsList[0]?.[0] ?? null;

  return (
    <div className="relative flex h-full flex-1 min-w-0">
      {/* Chat column */}
      <div
        className="flex h-full flex-col flex-1 min-w-0"
        style={{ minHeight: 0 }}
      >
        {/* Header with model name (model selector is in MessageEditor) */}
        <div className="flex shrink-0 items-center justify-between border-b border-sidebar px-4 py-2">
          <span className="text-sm text-sidebar-muted truncate">
            {agent.state.model?.name ?? "No model"}
          </span>
        </div>

        {/* Message list + streaming */}
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
          <div className="max-w-3xl mx-auto p-4 pb-0 flex flex-col gap-3">
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

        {/* Input + stats */}
        <div className="shrink-0 border-t border-sidebar">
          <div className="max-w-3xl mx-auto px-2 pt-2">
            <MessageEditor
              value={input}
              onChange={setInput}
              isStreaming={isStreaming}
              currentModel={agent.state.model}
              thinkingLevel={agent.state.thinkingLevel ?? "off"}
              onThinkingChange={(level) => agent.setThinkingLevel(level)}
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
            "flex flex-col border-l border-sidebar bg-sidebar/50 min-h-0",
            showArtifactsPanel ? "w-80 shrink-0" : "w-0 overflow-hidden"
          )}
          style={{ minHeight: 0 }}
        >
          {showArtifactsPanel && (
            <>
              <div className="shrink-0 flex items-center justify-between px-2 py-2 border-b border-sidebar">
                <span className="text-sm font-medium text-sidebar">Artifacts</span>
                <button
                  type="button"
                  onClick={() => setShowArtifactsPanel(false)}
                  className="text-sidebar-muted hover:text-sidebar p-1 rounded"
                  aria-label="Close artifacts"
                >
                  ×
                </button>
              </div>
              <div className="shrink-0 flex overflow-x-auto gap-1 p-2 border-b border-sidebar">
                {artifactsList.map(([filename]) => (
                  <button
                    key={filename}
                    type="button"
                    onClick={() => setActiveArtifact(filename)}
                    className={cn(
                      "shrink-0 rounded px-2 py-1 text-xs font-mono whitespace-nowrap border",
                      selectedFilename === filename
                        ? "border-emerald-500 bg-emerald-500/20 text-sidebar"
                        : "border-sidebar bg-sidebar-hover text-sidebar-muted hover:text-sidebar"
                    )}
                  >
                    {filename}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto p-3 min-h-0">
                <pre className="text-xs text-sidebar whitespace-pre-wrap wrap-break-word font-mono bg-sidebar-hover/50 rounded p-3 min-h-0">
                  {selectedContent}
                </pre>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating pill to show artifacts when panel is closed */}
      {hasArtifacts && !showArtifactsPanel && (
        <button
          type="button"
          onClick={() => setShowArtifactsPanel(true)}
          className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-sidebar bg-sidebar px-3 py-1.5 text-xs text-sidebar shadow-lg hover:bg-sidebar-hover"
          title="Show artifacts"
        >
          Artifacts ({artifactsList.length})
        </button>
      )}
    </div>
  );
}
