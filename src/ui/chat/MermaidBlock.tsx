import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { useResolvedTheme } from "../contexts/ThemeProvider";
import { CodeBlock } from "./CodeBlock";

interface MermaidBlockProps {
  chart: string;
  className?: string;
}

type MermaidModule = typeof import("mermaid");

let mermaidModulePromise: Promise<MermaidModule> | null = null;

function loadMermaid(): Promise<MermaidModule> {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid");
  }
  return mermaidModulePromise;
}

export function MermaidBlock({ chart, className }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramIdRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 10)}`);
  const resolvedTheme = useResolvedTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderChart = async () => {
      try {
        const mermaidModule = await loadMermaid();
        const mermaid = mermaidModule.default;
        const container = containerRef.current;

        if (!container || cancelled) {
          return;
        }

        container.innerHTML = "";
        setError(null);

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "dark" ? "dark" : "default",
        });

        const { svg, bindFunctions } = await mermaid.render(diagramIdRef.current, chart);

        if (!container || cancelled) {
          return;
        }

        container.innerHTML = svg;
        bindFunctions?.(container);
      } catch (renderError) {
        console.error("Failed to render Mermaid diagram:", renderError);
        if (!cancelled) {
          setError("Failed to render Mermaid diagram.");
        }
      }
    };

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme]);

  if (error) {
    return (
      <div className={cn("my-4 space-y-2", className)}>
        <div className="rounded-xl border border-semantic-error/30 bg-semantic-error/10 px-3 py-2 text-xs text-semantic-error">
          {error}
        </div>
        <CodeBlock code={chart} language="mermaid" className="my-0" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "my-4 overflow-x-auto rounded-2xl border border-sidebar-soft bg-sidebar-panel px-3 py-3",
        className
      )}
    >
      <div ref={containerRef} className="mermaid-diagram min-w-fit text-sidebar" />
    </div>
  );
}
