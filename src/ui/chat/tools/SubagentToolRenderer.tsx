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
  _result: ToolResultMessage | undefined,
  isStreaming?: boolean,
): ToolRenderResult {
  const subtasks = params?.subtasks;

  if (!subtasks || subtasks.length === 0) {
    const state = isStreaming ? "inprogress" : "complete";
    return {
      content: (
        <div className="flex items-center gap-2 text-sm text-sidebar-muted">
          {state === "inprogress" && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sidebar-muted border-t-sidebar" />
          )}
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span>Preparing subtasks…</span>
        </div>
      ),
      isCustom: true,
    };
  }

  return {
    content: (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-sidebar-muted">
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span>Subtasks ({subtasks.length})</span>
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
