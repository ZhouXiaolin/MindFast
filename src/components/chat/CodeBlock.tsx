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
        "overflow-x-auto rounded-md border border-sidebar bg-sidebar-hover/50 px-3 py-2 text-xs font-mono text-sidebar",
        className
      )}
      data-language={language}
    >
      <code>{code}</code>
    </pre>
  );
}
