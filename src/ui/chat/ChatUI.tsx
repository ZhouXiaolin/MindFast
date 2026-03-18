import { useEffect, useState, useRef, useCallback } from "react";
import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { MessageList } from "./MessageList";
import { StreamingMessageContainer } from "./StreamingMessageContainer";
import { MessageEditor } from "./MessageEditor";
import { cn } from "../../utils/cn";
import { useAppStore } from "../../stores/app";
import { useChatRuntime } from "./useChatRuntime";
import { useChatPersistence } from "./useChatPersistence";
import { useChatModelMenu } from "./useChatModelMenu";
import { useChatUsage } from "./useChatUsage";
import { useArtifactsPanel } from "./useArtifactsPanel";
import { ChatModelPicker } from "./ChatModelPicker";
import { ChatArtifactsPanel } from "./ChatArtifactsPanel";

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
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const {
    agent,
    artifactsList,
    currentModel,
    isHydratingRef,
    isSessionReady,
    isStreaming,
    messages,
    streamMessage,
    syncAgentState,
    thinkingLevel,
  } = useChatRuntime(sessionId);
  const {
    enabledModels,
    handleSelectModelOption,
    handleToggleMenu,
    isLoadingModels,
    modelMenuOpen,
    modelMenuRef,
  } = useChatModelMenu({
    agent,
    syncAgentState,
  });
  const { usageText } = useChatUsage(messages);
  const {
    hasArtifacts,
    openArtifact,
    openPanel,
    closePanel,
    selectedArtifact,
    selectedFilename,
    selectArtifact,
    showArtifactsPanel,
  } = useArtifactsPanel(artifactsList);

  const scrollToBottom = useCallback(() => {
    if (!autoScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamMessage, scrollToBottom]);

  useChatPersistence({
    agent,
    isHydratingRef,
    messages,
    sessionId,
    touchWorkspaceRevision,
  });

  const handleSend = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !agent || isStreaming) return;
      if (!isSessionReady()) return;
      setInput("");
      autoScrollRef.current = true;
      try {
        await agent.prompt(t);
      } catch (err) {
        console.error(err);
      }
    },
    [agent, isSessionReady, isStreaming]
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
      if (!isSessionReady()) return;

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
    [agent, isSessionReady, isStreaming, messages, syncAgentState]
  );

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

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center text-sidebar-muted">
        Loading…
      </div>
    );
  }

  const isEmptyChat = messages.length === 0 && !streamMessage;

  return (
    <div className="relative flex h-full flex-1 min-w-0">
      {/* Chat column */}
      <div
        className={cn("chat-column-shell flex h-full min-w-0 flex-1 flex-col", CHAT_FONT_CLASS[chatFont])}
        style={{ minHeight: 0 }}
      >
        <div className="chat-topbar flex shrink-0 items-center justify-between border-b border-sidebar-soft px-4 py-3">
          <ChatModelPicker
            currentModel={currentModel}
            enabledModels={enabledModels}
            isLoadingModels={isLoadingModels}
            modelMenuOpen={modelMenuOpen}
            modelMenuRef={modelMenuRef}
            onSelectModelOption={(providerId, modelId) => {
              void handleSelectModelOption(providerId, modelId);
            }}
            onToggleMenu={() => {
              void handleToggleMenu();
            }}
          />
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
                  onOpenArtifact={openArtifact}
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
                    onOpenArtifact={openArtifact}
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

      {hasArtifacts ? (
        <ChatArtifactsPanel
          artifactsList={artifactsList}
          selectedArtifact={selectedArtifact}
          selectedFilename={selectedFilename}
          showArtifactsPanel={showArtifactsPanel}
          onClosePanel={closePanel}
          onOpenPanel={openPanel}
          onSelectArtifact={selectArtifact}
        />
      ) : null}
    </div>
  );
}
