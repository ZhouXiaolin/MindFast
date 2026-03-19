import type { ToolResultMessage } from "@mariozechner/pi-ai";
import { Loader2, CheckCircle2, XCircle, GitBranch } from "lucide-react";
import type { SubtasksToolParams, Subtask, SubtaskStatus } from "../../../ai/subagent-types";
import { cn } from "../../../utils/cn";
import type { ToolRenderResult } from "./types";

let _onSelectSubagent: ((id: string) => void) | undefined;
let _getSubtaskStatus: ((id: string) => SubtaskStatus) | undefined;

export function setSubagentCallbacks(
  onSelect?: (id: string) => void,
  getStatus?: (id: string) => SubtaskStatus
) {
  _onSelectSubagent = onSelect;
  _getSubtaskStatus = getStatus;
}

function StatusIcon({ status }: { status: SubtaskStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />;
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-accent" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-semantic-error" />;
    default:
      return <span className="h-3.5 w-3.5 rounded-full border-2 border-sidebar-muted" />;
  }
}

function SubtaskLabel({ subtask }: { subtask: Subtask }) {
  const status = _getSubtaskStatus?.(subtask.id) ?? "pending";
  return (
    <button
      type="button"
      onClick={() => _onSelectSubagent?.(subtask.id)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
        "border border-sidebar-soft bg-sidebar-panel hover:bg-sidebar-panel-strong",
        "shadow-[inset_0_1px_0_color-mix(in_srgb,var(--sidebar-fg)_0.04,transparent)]"
      )}
    >
      <StatusIcon status={status} />
      <span className="flex-1 truncate text-sidebar">{subtask.label}</span>
      <span className="shrink-0 text-xs text-sidebar-muted">
        {status === "running" ? "Running…" : status === "completed" ? "Done" : status === "failed" ? "Failed" : "Waiting"}
      </span>
    </button>
  );
}

export function renderSubagentTool(
  _toolName: string,
  params: SubtasksToolParams | undefined,
  result: ToolResultMessage | undefined,
  _isStreaming?: boolean,
): ToolRenderResult {
  const subtasks = params?.subtasks;
  const isDone = !!result;

  // Creating state: params still streaming in, no subtasks yet
  if (!subtasks || subtasks.length === 0) {
    return {
      content: (
        <div className="flex items-center gap-2 text-sm text-sidebar-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span>Creating subtasks…</span>
        </div>
      ),
      isCustom: true,
    };
  }

  // Completed state: tool has returned a result
  if (isDone) {
    const allStatuses = subtasks.map((st) => _getSubtaskStatus?.(st.id) ?? "pending");
    const completedCount = allStatuses.filter((s) => s === "completed").length;
    const failedCount = allStatuses.filter((s) => s === "failed").length;

    return {
      content: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-sidebar-muted">
            {failedCount > 0 ? (
              <XCircle className="h-3.5 w-3.5 shrink-0 text-semantic-error" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
            )}
            <span>
              Subtasks done — {completedCount}/{subtasks.length} completed
              {failedCount > 0 ? `, ${failedCount} failed` : ""}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {subtasks.map((st) => (
              <SubtaskLabel key={st.id} subtask={st} />
            ))}
          </div>
        </div>
      ),
      isCustom: true,
    };
  }

  // Running state: subtasks known, tool still executing
  const allStatuses = subtasks.map((st) => _getSubtaskStatus?.(st.id) ?? "pending");
  const runningCount = allStatuses.filter((s) => s === "running").length;
  const completedCount = allStatuses.filter((s) => s === "completed").length;

  return {
    content: (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-sidebar-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-accent" />
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span>
            {runningCount > 0
              ? `Running subtasks — ${completedCount}/${subtasks.length} done`
              : `Subtasks (${subtasks.length})`}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {subtasks.map((st) => (
            <SubtaskLabel key={st.id} subtask={st} />
          ))}
        </div>
      </div>
    ),
    isCustom: true,
  };
}
