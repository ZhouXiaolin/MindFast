import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { WorkspaceFile } from "../../ai/workspace/types";
import { isPlanPath, normalizeWorkspacePath } from "../../ai/workspace-types";

export interface PlanStep {
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface PlanData {
  planId: string;
  steps: PlanStep[];
  isAllComplete: boolean;
}

function parsePlanJsonl(content: string): PlanStep[] {
  const steps: PlanStep[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (typeof parsed.description === "string" && typeof parsed.status === "string") {
        steps.push({
          description: parsed.description,
          status: parsed.status as PlanStep["status"],
        });
      }
    } catch {
      // skip invalid lines
    }
  }
  return steps;
}

export function usePlanPanel(
  workspaceFiles: WorkspaceFile[],
  messages: AgentMessage[],
  options: { resetKey?: string } = {}
) {
  const planData = useMemo<PlanData | null>(() => {
    const planFile = workspaceFiles
      .filter((f) => isPlanPath(f.filename) && f.filename.endsWith(".jsonl"))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

    if (!planFile) return null;

    const steps = parsePlanJsonl(planFile.content);
    if (steps.length === 0) return null;

    const planId = normalizeWorkspacePath(planFile.filename)
      .replace(/^plans\//, "")
      .replace(/\.jsonl$/, "");
    const isAllComplete = steps.every(
      (s) => s.status === "completed" || s.status === "failed"
    );

    return { planId, steps, isAllComplete };
  }, [workspaceFiles]);

  const [dismissed, setDismissed] = useState(false);
  const prevPlanIdRef = useRef<string | null>(null);
  const planCompleteRef = useRef(false);

  useEffect(() => {
    setDismissed(false);
    planCompleteRef.current = false;
    prevPlanIdRef.current = null;
  }, [options.resetKey]);

  useEffect(() => {
    if (planData && planData.planId !== prevPlanIdRef.current) {
      prevPlanIdRef.current = planData.planId;
      setDismissed(false);
      planCompleteRef.current = false;
    }
    if (!planData) {
      prevPlanIdRef.current = null;
      planCompleteRef.current = false;
    }
  }, [planData]);

  useEffect(() => {
    if (planData?.isAllComplete) {
      planCompleteRef.current = true;
    }
  }, [planData?.isAllComplete]);

  useEffect(() => {
    if (!planCompleteRef.current || dismissed || !planData) return;

    const lastMsg = messages[messages.length - 1];
    const lastRole = (lastMsg as { role?: string })?.role;
    if (lastRole === "user" || lastRole === "user-with-attachments") {
      setDismissed(true);
    }
  }, [messages.length, dismissed, planData]);

  const visible = !!planData && !dismissed;

  return { planData, visible };
}
