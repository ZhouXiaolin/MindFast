import { Loader2, CheckCircle2, XCircle, GitBranch } from "lucide-react";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { AssistantMessage as AssistantMessageType, ToolResultMessage } from "@mariozechner/pi-ai";
import type { SubtaskWithResult, SubtaskStatus } from "../../ai/subagent-types";
import { cn } from "../../utils/cn";
import { AssistantMessage } from "./AssistantMessage";

interface ChatSubagentsPanelProps {
  tasks: SubtaskWithResult[];
  selectedTaskId: string | null;
  selectedTask: SubtaskWithResult | null;
  showPanel: boolean;
  onClosePanel: () => void;
  onSelectTask: (id: string) => void;
  tools?: AgentTool[];
}

function StatusBadge({ status }: { status: SubtaskStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-3 w-3 animate-spin text-accent" />;
    case "completed":
      return <CheckCircle2 className="h-3 w-3 text-accent" />;
    case "failed":
      return <XCircle className="h-3 w-3 text-semantic-error" />;
    default:
      return <span className="h-3 w-3 rounded-full border-2 border-sidebar-muted" />;
  }
}

function SubtaskRunView({
  task,
  tools,
}: {
  task: SubtaskWithResult;
  tools: AgentTool[];
}) {
  const run = task.run;

  if (!run) {
    if (task.status === "pending") {
      return (
        <div className="flex flex-1 items-center justify-center text-sm text-sidebar-muted">
          Waiting to start…
        </div>
      );
    }
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-sidebar-muted">
        No data available
      </div>
    );
  }

  const toolResultsById = new Map<string, ToolResultMessage>();
  for (const m of run.messages) {
    if (m.role === "toolResult") {
      const tr = m as ToolResultMessage & { toolCallId: string };
      toolResultsById.set(tr.toolCallId, tr);
    }
  }

  const messageParts: React.ReactNode[] = [];
  for (const msg of run.messages) {
    if (msg.role === "assistant") {
      messageParts.push(
        <AssistantMessage
          key={messageParts.length}
          message={msg as AssistantMessageType}
          tools={tools}
          pendingToolCalls={new Set()}
          toolResultsById={toolResultsById}
          isStreaming={false}
        />
      );
    }
  }

  if (run.isStreaming && run.streamMessage?.role === "assistant") {
    messageParts.push(
      <AssistantMessage
        key="streaming"
        message={run.streamMessage as AssistantMessageType}
        tools={tools}
        pendingToolCalls={new Set()}
        toolResultsById={toolResultsById}
        isStreaming
      />
    );
  }

  if (run.isStreaming && !run.streamMessage && messageParts.length === 0) {
    messageParts.push(
      <div key="loading" className="flex items-center gap-2 text-sm text-sidebar-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Running…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-3">
          {messageParts}
        </div>
      </div>
    </div>
  );
}

export function ChatSubagentsPanel({
  tasks,
  selectedTaskId,
  selectedTask,
  showPanel,
  onClosePanel,
  onSelectTask,
  tools = [],
}: ChatSubagentsPanelProps) {
  if (tasks.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          "min-h-0 border-l border-sidebar-soft bg-sidebar-panel backdrop-blur-sm",
          showPanel ? "flex w-[min(44rem,48vw)] shrink-0 flex-col" : "hidden"
        )}
        style={{ minHeight: 0 }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sidebar-soft px-4 py-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-sidebar-muted" />
            <div>
              <div className="text-sm font-medium text-sidebar">Subtasks</div>
              <div className="mt-0.5 text-xs text-sidebar-muted">
                {tasks.filter((t) => t.status === "completed").length}/{tasks.length} completed
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClosePanel}
            className="rounded-full p-2 text-sidebar-muted transition-colors hover:bg-sidebar-panel-strong hover:text-sidebar"
            aria-label="Close subtasks"
          >
            ×
          </button>
        </div>

        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-sidebar-soft px-4 py-3">
          {tasks.map((task) => (
            <button
              key={task.runKey}
              type="button"
              onClick={() => onSelectTask(task.runKey)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                selectedTaskId === task.runKey
                  ? "border-accent/30 bg-accent/10 text-sidebar"
                  : "border-sidebar-soft bg-sidebar-panel text-sidebar-muted hover:bg-sidebar-panel-strong hover:text-sidebar"
              )}
            >
              <StatusBadge status={task.status} />
              <span>{task.label}</span>
            </button>
          ))}
        </div>

        {selectedTask ? (
          <SubtaskRunView task={selectedTask} tools={tools} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-sidebar-muted">
            Select a subtask to view details
          </div>
        )}
      </div>

      {!showPanel && tasks.length > 0 ? (
        <button
          type="button"
          onClick={() => onSelectTask(tasks[0].runKey)}
          className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-sidebar-soft bg-sidebar-panel px-3 py-1.5 text-xs text-sidebar shadow-lg transition-colors hover:bg-sidebar-panel-strong"
          title="Show subtasks"
        >
          Subtasks ({tasks.length})
        </button>
      ) : null}
    </>
  );
}
