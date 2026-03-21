import { Circle, CircleDot, CircleCheck, CircleX } from "lucide-react";
import { cn } from "../../utils/cn";
import type { PlanData, PlanStep } from "./usePlanPanel";

interface ChatPlanPanelProps {
  planData: PlanData;
}

function StepIcon({ status }: { status: PlanStep["status"] }) {
  if (status === "in_progress") {
    return <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-pulse text-accent" />;
  }
  if (status === "completed") {
    return <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-semantic-success" />;
  }
  if (status === "failed") {
    return <CircleX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-semantic-error" />;
  }
  return <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sidebar-muted" />;
}

export function ChatPlanPanel({ planData }: ChatPlanPanelProps) {
  const { steps } = planData;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="relative mx-auto h-full w-full max-w-3xl px-4">
        <div
          className={cn(
            "pointer-events-auto absolute right-full top-1/2 mr-3 w-56 -translate-y-1/2",
            "rounded-xl border border-sidebar-soft bg-sidebar-panel shadow-card-md backdrop-blur-sm",
            "transition-opacity duration-300"
          )}
        >
          <ul className="flex flex-col gap-1.5 px-3 py-3">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <StepIcon status={step.status} />
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
      </div>
    </div>
  );
}
