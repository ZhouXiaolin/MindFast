import { useMemo } from "react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { AssistantMessage, ToolResultMessage } from "@mariozechner/pi-ai";
import {
  extractSubtasksFromToolCall,
  getSubtaskRunKey,
  SUBAGENT_TOOL_NAME,
  type SubtaskStatus,
  type SubtaskWithResult,
  type SubtaskRun,
} from "../../ai/subagent-types";

interface SubagentTasksResult {
  tasks: SubtaskWithResult[];
  hasSubagentTasks: boolean;
  hasRunningSubagents: boolean;
  statusMap: Map<string, SubtaskStatus>;
}

/**
 * Parse subtask list from the message stream.
 * Looks for bash tool calls that launch `subagent`, with stdin JSON
 * containing `subtasks: Array<{ id, label, prompt }>`.
 *
 * Status is derived from pendingToolCalls and toolResult availability.
 * The overall tool call wrapping all subtasks has a single toolCallId;
 * individual subtask runs are tracked by a map keyed by toolCallId + subtask id.
 */
export function useSubagentTasks(
  messages: AgentMessage[],
  pendingToolCalls: Set<string>,
  subtaskRuns?: Map<string, SubtaskRun>,
): SubagentTasksResult {
  return useMemo(() => {
    const toolResultsById = new Map<string, ToolResultMessage>();
    for (const m of messages) {
      if (m.role === "toolResult") {
        const tr = m as ToolResultMessage & { toolCallId: string };
        toolResultsById.set(tr.toolCallId, tr);
      }
    }

    const allTasks: SubtaskWithResult[] = [];

    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const amsg = msg as AssistantMessage;
      for (const chunk of amsg.content ?? []) {
        if (chunk.type !== "toolCall") continue;
        const tc = chunk as { id: string; name: string; arguments?: unknown };
        if (tc.name !== SUBAGENT_TOOL_NAME) continue;
        const subtasks = extractSubtasksFromToolCall(tc.name, tc.arguments);
        if (!subtasks || subtasks.length === 0) continue;

        const isPending = pendingToolCalls.has(tc.id);
        const hasResult = toolResultsById.has(tc.id);

        for (const st of subtasks) {
          const runKey = getSubtaskRunKey(tc.id, st.id);
          const run = subtaskRuns?.get(runKey);
          let status: SubtaskStatus;

          if (run) {
            if (run.error) {
              status = "failed";
            } else if (run.isStreaming) {
              status = "running";
            } else if (run.messages.length > 0) {
              const lastMsg = run.messages[run.messages.length - 1];
              const stopReason = (lastMsg as { stopReason?: string }).stopReason;
              status = stopReason === "error" ? "failed" : "completed";
            } else {
              status = "pending";
            }
          } else if (hasResult) {
            status = "completed";
          } else if (isPending) {
            status = "running";
          } else {
            status = "pending";
          }

          allTasks.push({ ...st, toolCallId: tc.id, runKey, status, run });
        }
      }
    }

    const statusMap = new Map<string, SubtaskStatus>();
    for (const t of allTasks) {
      statusMap.set(t.runKey, t.status);
    }

    return {
      tasks: allTasks,
      hasSubagentTasks: allTasks.length > 0,
      hasRunningSubagents: allTasks.some(
        (t) => t.status === "running" || t.status === "pending"
      ),
      statusMap,
    };
  }, [messages, pendingToolCalls, subtaskRuns]);
}
