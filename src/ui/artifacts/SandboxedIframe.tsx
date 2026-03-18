import { useEffect, useId, useRef } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";

export interface SandboxConsoleEntry {
  type: "log" | "warn" | "error" | "info";
  text: string;
}

interface SandboxedIframeProps {
  htmlContent: string;
  className?: string;
  onConsoleMessage?: (entry: SandboxConsoleEntry) => void;
  onRuntimeError?: (message: string | null) => void;
}

function getRuntimeScript(sandboxId: string): string {
  return `<style>
html, body {
  font-size: initial;
}
</style>
<script>
window.__mindfastSandboxId = ${JSON.stringify(sandboxId)};

(function() {
  const post = (payload) => {
    window.parent.postMessage({
      __mindfastSandbox: true,
      sandboxId: window.__mindfastSandboxId,
      ...payload
    }, "*");
  };

  const originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  ["log", "info", "warn", "error"].forEach((method) => {
    console[method] = (...args) => {
      originalConsole[method](...args);
      const text = args
        .map((arg) => {
          try {
            return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ");
      post({ type: "console", method, text });
    };
  });

  window.addEventListener("error", (event) => {
    post({
      type: "runtime-error",
      message: event.error?.message || event.message || "Unknown runtime error",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    post({
      type: "runtime-error",
      message: event.reason?.message || String(event.reason) || "Unhandled promise rejection",
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    const link = target instanceof Element ? target.closest("a") : null;
    if (!link || !link.href) return;
    if (link.getAttribute("href")?.startsWith("#")) return;

    const href = link.href;
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      event.preventDefault();
      event.stopPropagation();
      post({ type: "open-external-url", url: href });
    }
  }, true);

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.action) return;
    event.preventDefault();
    event.stopPropagation();
    post({ type: "open-external-url", url: form.action });
  }, true);

  const originalOpen = window.open.bind(window);
  window.open = (url, target, features) => {
    if (typeof url === "string" && url) {
      post({ type: "open-external-url", url });
      return null;
    }
    return originalOpen(url, target, features);
  };

  try {
    const currentLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      get() {
        return currentLocation;
      },
      set(url) {
        post({ type: "open-external-url", url: String(url) });
      },
    });
  } catch {
    // Ignore browsers that prevent overriding location in sandboxed contexts.
  }
})();
</script>`;
}

function prepareHtmlDocument(sandboxId: string, htmlContent: string): string {
  const runtime = getRuntimeScript(sandboxId);

  const headMatch = htmlContent.match(/<head[^>]*>/i);
  if (headMatch) {
    const index = headMatch.index! + headMatch[0].length;
    return htmlContent.slice(0, index) + runtime + htmlContent.slice(index);
  }

  const htmlMatch = htmlContent.match(/<html[^>]*>/i);
  if (htmlMatch) {
    const index = htmlMatch.index! + htmlMatch[0].length;
    return htmlContent.slice(0, index) + runtime + htmlContent.slice(index);
  }

  return `<!DOCTYPE html><html><head>${runtime}</head><body>${htmlContent}</body></html>`;
}

export function SandboxedIframe({
  htmlContent,
  className,
  onConsoleMessage,
  onRuntimeError,
}: SandboxedIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const sandboxId = useId();

  useEffect(() => {
    onRuntimeError?.(null);
  }, [htmlContent, onRuntimeError]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      if (!event.data?.__mindfastSandbox || event.data?.sandboxId !== sandboxId) return;

      if (event.data.type === "console") {
        onConsoleMessage?.({
          type: event.data.method,
          text: event.data.text,
        });
        return;
      }

      if (event.data.type === "runtime-error") {
        onRuntimeError?.(event.data.message ?? "Unknown runtime error");
        return;
      }

      if (event.data.type === "open-external-url" && event.data.url) {
        try {
          await openUrl(event.data.url);
        } catch {
          window.open(event.data.url, "_blank", "noopener,noreferrer");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onConsoleMessage, onRuntimeError, sandboxId]);

  return (
    <iframe
      ref={iframeRef}
      title="Artifact Preview"
      sandbox="allow-scripts allow-modals"
      srcDoc={prepareHtmlDocument(sandboxId, htmlContent)}
      className={className}
    />
  );
}
