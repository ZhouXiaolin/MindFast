import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
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
import { useArtifactsPanel, type ArtifactPanelItem } from "./useArtifactsPanel";
import { ChatModelPicker } from "./ChatModelPicker";
import { ChatArtifactsPanel } from "./ChatArtifactsPanel";
import { useSubagentTasks } from "./useSubagentTasks";
import { useSubagentPanel } from "./useSubagentPanel";
import { ChatSubagentsPanel } from "./ChatSubagentsPanel";
import { SubagentToolProvider } from "./tools";
import { useSubtaskRuns } from "./useSubtaskRuns";
import {
  ArtifactPreviewProvider,
  useArtifactPreviewEntries,
  type ArtifactPreviewEntry,
} from "../artifacts/ArtifactPreviewContext";
import { isArtifactPath, normalizeWorkspacePath } from "../../ai/workspace-types";
import type { WorkspaceFile, WorkspaceFileMessage } from "../../ai/workspace/types";
import {
  extractSubtasksFromToolCall,
  type SubtaskWithResult,
} from "../../ai/subagent-types";
interface ChatUIProps {
  sessionId: string;
}

const CHAT_FONT_CLASS: Record<import("../../stores/app").ChatFont, string> = {
  default: "font-chat-default",
  sans: "font-chat-sans",
  system: "font-chat-system",
  dyslexic: "font-chat-dyslexic",
};

function addArtifactPanelItem(
  itemsByPath: Map<string, ArtifactPanelItem>,
  artifact: WorkspaceFile,
  id: string,
  label: string
) {
  const normalizedPath = normalizeWorkspacePath(artifact.filename);
  if (!isArtifactPath(normalizedPath) || itemsByPath.has(normalizedPath)) {
    return;
  }

  itemsByPath.set(normalizedPath, {
    id,
    artifact: { ...artifact, filename: normalizedPath },
    label,
  });
}

function buildArtifactPanelItems({
  committedArtifacts,
  artifactPreviewEntries,
  subtaskTasks,
}: {
  committedArtifacts: WorkspaceFile[];
  artifactPreviewEntries: Map<string, ArtifactPreviewEntry>;
  subtaskTasks: SubtaskWithResult[];
}): ArtifactPanelItem[] {
  const itemsByPath = new Map<string, ArtifactPanelItem>();

  for (const artifact of committedArtifacts) {
    addArtifactPanelItem(
      itemsByPath,
      artifact,
      `main:${artifact.id}`,
      normalizeWorkspacePath(artifact.filename)
    );
  }

  for (const entry of artifactPreviewEntries.values()) {
    if (entry.phase === "committed" || !entry.toolCallId) {
      continue;
    }

    const normalizedPath = normalizeWorkspacePath(entry.path);
    addArtifactPanelItem(
      itemsByPath,
      {
        id: `live:${entry.toolCallId}:${normalizedPath}`,
        filename: normalizedPath,
        content: entry.canRenderContent ? entry.content ?? "" : "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      `live:${entry.toolCallId}:${normalizedPath}`,
      normalizedPath
    );
  }

  for (const task of subtaskTasks) {
    for (const [index, artifact] of (task.run?.files ?? []).entries()) {
      const normalizedPath = normalizeWorkspacePath(artifact.filename);
      addArtifactPanelItem(
        itemsByPath,
        artifact,
        `subtask:${artifact.id ?? `${task.runKey}:${normalizedPath}:${index}`}`,
        `${normalizedPath} · ${task.label}`
      );
    }
  }

  return Array.from(itemsByPath.values());
}

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
    sessionReady,
    workspaceFiles,
    currentModel,
    isHydratingRef,
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
  const pendingToolCalls = agent?.state.pendingToolCalls ?? new Set<string>();
  const artifactPreviewEntries = useArtifactPreviewEntries(
    messages,
    streamMessage,
    pendingToolCalls,
    workspaceFiles
  );
  const subtaskRuns = useSubtaskRuns();
  const {
    tasks: subagentTasks,
    hasSubagentTasks,
    hasRunningSubagents,
    statusMap,
  } = useSubagentTasks(messages, pendingToolCalls, subtaskRuns);
  const {
    showSubagentsPanel,
    selectedTaskId,
    selectedTask,
    closePanel: closeSubagentPanel,
    selectTask: selectSubagentTask,
  } = useSubagentPanel(subagentTasks, {
    autoOpenEnabled: sessionReady,
    resetKey: sessionId,
  });

  const currentTurnMessages = useMemo<AgentMessage[]>(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const role = (messages[index] as { role?: string }).role;
      if (role === "user" || role === "user-with-attachments") {
        return messages.slice(index + 1);
      }
    }
    return messages;
  }, [messages]);

  const currentTurnSubagentToolCallIds = useMemo(() => {
    const ids = new Set<string>();

    for (const message of currentTurnMessages) {
      if (message.role !== "assistant") {
        continue;
      }

      const content = (message as { content?: Array<{ type?: string; id?: string; name?: string; arguments?: unknown }> }).content ?? [];
      for (const chunk of content) {
        if (chunk.type !== "toolCall" || !chunk.id || !chunk.name) {
          continue;
        }
        if (extractSubtasksFromToolCall(chunk.name, chunk.arguments)) {
          ids.add(chunk.id);
        }
      }
    }

    return ids;
  }, [currentTurnMessages]);

  const currentTurnSubagentTasks = useMemo(
    () => subagentTasks.filter((task) => currentTurnSubagentToolCallIds.has(task.toolCallId)),
    [currentTurnSubagentToolCallIds, subagentTasks]
  );

  const currentTurnArtifacts = useMemo<WorkspaceFile[]>(() => {
    const artifactsByPath = new Map<string, WorkspaceFile>();

    for (const message of currentTurnMessages) {
      if ((message as { role?: string }).role !== "workspaceFile") {
        continue;
      }

      const workspaceFileMessage = message as WorkspaceFileMessage;
      const normalizedPath = normalizeWorkspacePath(workspaceFileMessage.filename);
      if (!isArtifactPath(normalizedPath)) {
        continue;
      }

      if (workspaceFileMessage.action === "delete") {
        artifactsByPath.delete(normalizedPath);
        continue;
      }

      if (workspaceFileMessage.content === undefined) {
        continue;
      }

      artifactsByPath.set(normalizedPath, {
        id: `current:${workspaceFileMessage.timestamp}:${normalizedPath}`,
        filename: normalizedPath,
        content: workspaceFileMessage.content,
        createdAt: new Date(workspaceFileMessage.timestamp),
        updatedAt: new Date(workspaceFileMessage.timestamp),
      });
    }

    return Array.from(artifactsByPath.values());
  }, [currentTurnMessages]);

  const allArtifactItems = useMemo<ArtifactPanelItem[]>(() => {
    return buildArtifactPanelItems({
      committedArtifacts: workspaceFiles,
      artifactPreviewEntries,
      subtaskTasks: subagentTasks,
    });
  }, [artifactPreviewEntries, subagentTasks, workspaceFiles]);

  const artifactItems = useMemo<ArtifactPanelItem[]>(() => {
    return buildArtifactPanelItems({
      committedArtifacts: currentTurnArtifacts,
      artifactPreviewEntries,
      subtaskTasks: currentTurnSubagentTasks,
    });
  }, [artifactPreviewEntries, currentTurnArtifacts, currentTurnSubagentTasks]);

  const {
    hasArtifacts,
    openArtifact,
    closePanel,
    selectedArtifact,
    selectedArtifactId,
    selectArtifact,
    showArtifactsPanel,
    visibleArtifactsList,
  } = useArtifactsPanel(artifactItems, allArtifactItems, {
    autoOpenEnabled: sessionReady,
    resetKey: sessionId,
  });

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

  const prevIsStreamingRef = useRef(false);
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming) {
      requestAnimationFrame(() => {
        composerTextareaRef.current?.focus();
      });
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const handleSend = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !agent || isStreaming) return;
      if (!sessionReady) return;
      setInput("");
      autoScrollRef.current = true;
      try {
        await agent.prompt(t);
      } catch (err) {
        console.error(err);
      }
    },
    [agent, isStreaming, sessionReady]
  );

  const handleEditUserMessage = useCallback(
    async (messageIndex: number, newContent: string) => {
      const t = newContent.trim();
      if (!t || !agent || isStreaming) return;
      if (!sessionReady) return;

      autoScrollRef.current = true;
      setInput("");

      try {
        agent.abort();
        agent.replaceMessages(messages.slice(0, messageIndex));
        syncAgentState(agent, undefined, { reconstructWorkspace: true });
        await agent.prompt(t);
      } catch (error) {
        console.error(error);
      }
    },
    [agent, isStreaming, messages, sessionReady, syncAgentState]
  );

  const handleRetryUserMessage = useCallback(
    async (messageIndex: number, text: string) => {
      const t = text.trim();
      if (!t || !agent || isStreaming) return;
      if (!sessionReady) return;

      autoScrollRef.current = true;
      setInput("");

      try {
        agent.abort();
        agent.replaceMessages(messages.slice(0, messageIndex));
        syncAgentState(agent, undefined, { reconstructWorkspace: true });
        await agent.prompt(t);
      } catch (error) {
        console.error(error);
      }
    },
    [agent, isStreaming, messages, sessionReady, syncAgentState]
  );

  // 收集所有工具结果
  const toolResultsById = useRef(new Map<string, ToolResultMessage>()).current;
  toolResultsById.clear();
  for (const m of messages) {
    if (m.role === "toolResult") {
      toolResultsById.set((m as ToolResultMessage & { toolCallId: string }).toolCallId, m as ToolResultMessage);
    }
  }

  const tools = agent?.state.tools ?? [];

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center text-sidebar-muted">
        Loading…
      </div>
    );
  }

  const isEmptyChat = messages.length === 0 && !streamMessage;

  return (
    <ArtifactPreviewProvider entries={artifactPreviewEntries}>
      <div className="relative flex h-full flex-1 min-w-0">
      {/* Chat column */}
      <div
        className={cn("chat-column-shell flex h-full min-w-0 flex-1 flex-col", CHAT_FONT_CLASS[chatFont])}
        style={{ minHeight: 0 }}
      >
        <div className="chat-topbar flex shrink-0 items-center justify-between px-4 py-3">
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
                <SubagentToolProvider
                  statusMap={statusMap}
                  onSelectSubagent={selectSubagentTask}
                >
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
                </SubagentToolProvider>
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {!isEmptyChat ? (
          <div className="chat-composer-dock shrink-0">
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
              <div className="flex h-6 items-center justify-between px-2 py-1">
                {hasRunningSubagents ? (
                  <span className="flex items-center gap-1.5 text-xs text-accent">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                    Waiting for subtasks…
                  </span>
                ) : (
                  <span />
                )}
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

      {hasArtifacts && !showSubagentsPanel ? (
        <ChatArtifactsPanel
          artifactsList={visibleArtifactsList}
          selectedArtifact={selectedArtifact}
          selectedArtifactId={selectedArtifactId}
          showArtifactsPanel={showArtifactsPanel}
          onClosePanel={closePanel}
          onSelectArtifact={selectArtifact}
        />
      ) : null}

      {hasSubagentTasks ? (
        <ChatSubagentsPanel
          tasks={subagentTasks}
          selectedTaskId={selectedTaskId}
          selectedTask={selectedTask}
          showPanel={showSubagentsPanel}
          onClosePanel={closeSubagentPanel}
          onSelectTask={selectSubagentTask}
          tools={tools}
        />
      ) : null}
      </div>
    </ArtifactPreviewProvider>
  );
}
