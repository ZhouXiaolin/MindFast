import { cn } from "../../lib/cn";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "text", className }: CodeBlockProps) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-2xl border border-sidebar-soft bg-sidebar-panel px-3 py-3 text-xs font-mono text-sidebar",
        className
      )}
      data-language={language}
    >
      <code className="block whitespace-pre-wrap break-words">{code}</code>
    </pre>
  );
}
