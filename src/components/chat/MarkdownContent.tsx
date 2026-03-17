import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "../../lib/cn";
import { CodeBlock } from "./CodeBlock";

interface MarkdownContentProps {
  content: string;
  className?: string;
  tone?: "default" | "muted";
}

function getCodeLanguage(className?: string): string {
  const match = className?.match(/language-([\w-]+)/);
  return match?.[1] ?? "text";
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 text-2xl font-semibold tracking-tight text-sidebar first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight text-sidebar first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-base font-semibold text-sidebar first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-3 leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-2 pl-5 marker:text-sidebar-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-2 pl-5 marker:text-sidebar-muted">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-2xl border-l-2 border-sidebar-soft bg-sidebar-panel px-4 py-3 text-sm text-sidebar-muted">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 h-px border-0 bg-gradient-to-r from-transparent via-sidebar-soft to-transparent" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-emerald-300 underline decoration-emerald-500/40 underline-offset-4 transition-colors hover:text-emerald-200"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-sidebar">{children}</strong>,
  em: ({ children }) => <em className="italic text-sidebar">{children}</em>,
  code: ({ className, children }) => {
    const text = String(children).replace(/\n$/, "");
    const isBlock = !!className?.includes("language-") || text.includes("\n");

    if (isBlock) {
      return <CodeBlock code={text} language={getCodeLanguage(className)} className="my-4" />;
    }

    return (
      <code className="rounded-md bg-sidebar-panel-strong px-1.5 py-0.5 font-mono text-[0.85em] text-sidebar">
        {text}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-2xl border border-sidebar-soft bg-sidebar-panel">
      <table className="min-w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-sidebar-panel-strong text-sidebar">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-sidebar-soft px-3 py-2 font-medium whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-t border-sidebar-soft px-3 py-2 align-top">{children}</td>,
};

export function MarkdownContent({
  content,
  className,
  tone = "default",
}: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "max-w-none break-words text-sm",
        tone === "muted" ? "text-sidebar-muted" : "text-sidebar",
        className
      )}
    >
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
