import { useEffect, useRef } from "react";
import hljs from "highlight.js";
import { cn } from "../../utils/cn";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "text", className }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!codeRef.current) return;
    codeRef.current.removeAttribute("data-highlighted");
    try {
      if (language && language !== "text" && hljs.getLanguage(language)) {
        const result = hljs.highlight(code, { language, ignoreIllegals: true });
        codeRef.current.innerHTML = result.value;
      } else {
        codeRef.current.textContent = code;
      }
    } catch {
      codeRef.current.textContent = code;
    }
  }, [code, language]);

  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-2xl border border-sidebar-soft bg-sidebar-panel px-3 py-3 text-xs font-mono text-sidebar",
        className
      )}
      data-language={language}
    >
      <code
        ref={codeRef}
        className={cn(
          "block whitespace-pre-wrap break-words",
          language !== "text" && `hljs language-${language}`
        )}
      >
        {code}
      </code>
    </pre>
  );
}
