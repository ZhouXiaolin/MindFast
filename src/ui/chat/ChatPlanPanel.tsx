import { CircleCheck, CircleX } from "lucide-react";
import { cn } from "../../utils/cn";
import type { PlanData, PlanStep } from "./usePlanPanel";

interface ChatPlanPanelProps {
  planData: PlanData;
}

function StepIndicator({ status }: { status: PlanStep["status"] }) {
  if (status === "completed") {
    return <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-semantic-success" />;
  }
  if (status === "failed") {
    return <CircleX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-semantic-error" />;
  }
  if (status === "in_progress") {
    return <span className="mt-0.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent" />;
  }
  return <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border border-sidebar-muted" />;
}

export function ChatPlanPanel({ planData }: ChatPlanPanelProps) {
  const { planId, steps, isAllComplete } = planData;
  const completedCount = steps.filter(
    (s) => s.status === "completed" || s.status === "failed"
  ).length;

  return (
    <div
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2",
        "rounded-r-xl border border-l-0 border-sidebar-soft bg-sidebar-panel shadow-card-md backdrop-blur-sm",
        "transition-opacity duration-300"
      )}
      style={{
        left: 0,
        right: "calc(50% + 384px)",
        minWidth: "10rem",
      }}
    >
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-medium text-sidebar">
            {planId}
          </span>
          <span className="shrink-0 text-xs text-sidebar-muted">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto px-3 pb-3">
        <ul className="flex flex-col gap-1.5">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2">
              <StepIndicator status={step.status} />
              <span
                className={cn(
                  "text-xs leading-relaxed",
                  step.status === "completed" || step.status === "failed"
                    ? "text-sidebar-muted line-through"
                    : step.status === "in_progress"
                      ? "text-accent"
                      : "text-sidebar"
                )}
              >
                {step.description}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {isAllComplete && (
        <div className="border-t border-sidebar-soft px-3 py-2">
          <span className="text-xs text-semantic-success">Plan complete</span>
        </div>
      )}
    </div>
  );
}
