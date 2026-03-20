import { useEffect, useId, useRef } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import morphdomSource from "morphdom/dist/morphdom-umd.min.js?raw";

export interface SandboxConsoleEntry {
  type: "log" | "warn" | "error" | "info";
  text: string;
}

interface SandboxedIframeProps {
  htmlContent: string;
  className?: string;
  continuousHeightUpdates?: boolean;
  onConsoleMessage?: (entry: SandboxConsoleEntry) => void;
  onRuntimeError?: (message: string | null) => void;
  onHeightChange?: (height: number) => void;
}

function getRuntimeScript(sandboxId: string, continuousHeightUpdates: boolean): string {
  return `<style>
html, body {
  font-size: initial;
}
</style>
<script>
window.__mindfastSandboxId = ${JSON.stringify(sandboxId)};
window.__mindfastContinuousHeightUpdates = ${JSON.stringify(continuousHeightUpdates)};

(function() {
  ${morphdomSource}

  var morphdom = window.morphdom;

  var post = function(payload) {
    window.parent.postMessage(
      Object.assign({ __mindfastSandbox: true, sandboxId: window.__mindfastSandboxId }, payload),
      "*"
    );
  };

  var originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  ["log", "info", "warn", "error"].forEach(function(method) {
    console[method] = function() {
      originalConsole[method].apply(console, arguments);
      var args = Array.prototype.slice.call(arguments);
      var text = args.map(function(arg) {
        try { return typeof arg === "object" ? JSON.stringify(arg) : String(arg); } catch(e) { return String(arg); }
      }).join(" ");
      post({ type: "console", method: method, text: text });
    };
  });

  window.addEventListener("error", function(event) {
    post({
      type: "runtime-error",
      message: event.error && event.error.message || event.message || "Unknown runtime error",
    });
  });

  window.addEventListener("unhandledrejection", function(event) {
    post({
      type: "runtime-error",
      message: event.reason && event.reason.message || String(event.reason) || "Unhandled promise rejection",
    });
  });

  document.addEventListener("click", function(event) {
    var target = event.target;
    var link = target instanceof Element ? target.closest("a") : null;
    if (!link || !link.href) return;
    if (link.getAttribute("href") && link.getAttribute("href").startsWith("#")) return;
    var href = link.href;
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      event.preventDefault();
      event.stopPropagation();
      post({ type: "open-external-url", url: href });
    }
  }, true);

  document.addEventListener("submit", function(event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.action) return;
    event.preventDefault();
    event.stopPropagation();
    post({ type: "open-external-url", url: form.action });
  }, true);

  var originalOpen = window.open.bind(window);
  window.open = function(url, target, features) {
    if (typeof url === "string" && url) {
      post({ type: "open-external-url", url: url });
      return null;
    }
    return originalOpen(url, target, features);
  };

  try {
    var currentLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      get: function() { return currentLocation; },
      set: function(url) { post({ type: "open-external-url", url: String(url) }); },
    });
  } catch(e) {}

  // Height reporting
  function reportHeight() {
    var h = Math.max(
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0
    );
    if (h > 0) post({ type: "height-change", height: h });
  }

  window.addEventListener("load", function() {
    setTimeout(reportHeight, 50);
    setTimeout(reportHeight, 150);
    setTimeout(reportHeight, 400);
    setTimeout(reportHeight, 1000);
    if (window.__mindfastContinuousHeightUpdates) {
      try {
        new ResizeObserver(function() { reportHeight(); }).observe(document.documentElement);
      } catch(e) {}
    }
    post({ type: "iframe-ready" });
  });

  // morphdom incremental update
  window.addEventListener("message", function(event) {
    var data = event.data;
    if (!data || !data.__mindfastUpdate) return;
    if (data.sandboxId !== window.__mindfastSandboxId) return;
    if (data.type !== "update-html") return;
    try {
      var parser = new DOMParser();
      var newDoc = parser.parseFromString(data.html, "text/html");
      if (newDoc.body && document.body) {
        morphdom(document.body, newDoc.body, { childrenOnly: true });
      }
      reportHeight();
    } catch(e) {}
  });
})();
</script>`;
}

function prepareHtmlDocument(
  sandboxId: string,
  htmlContent: string,
  continuousHeightUpdates: boolean
): string {
  const runtime = getRuntimeScript(sandboxId, continuousHeightUpdates);

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

const DEBOUNCE_MS = 300;

export function SandboxedIframe({
  htmlContent,
  className,
  continuousHeightUpdates = false,
  onConsoleMessage,
  onRuntimeError,
  onHeightChange,
}: SandboxedIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const sandboxId = useId();

  // Freeze the initial srcDoc – never change it after first render.
  const initialSrcDocRef = useRef<string | null>(null);
  if (initialSrcDocRef.current === null) {
    initialSrcDocRef.current = prepareHtmlDocument(sandboxId, htmlContent, continuousHeightUpdates);
  }

  // Track whether the iframe has signalled it is ready to receive postMessages.
  const iframeReadyRef = useRef(false);
  // Queue a pending update when content arrives before the iframe is ready.
  const pendingHtmlRef = useRef<string | null>(null);

  useEffect(() => {
    onRuntimeError?.(null);
  }, [htmlContent, onRuntimeError]);

  // Message listener (console / errors / links / height / ready).
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      if (!event.data?.__mindfastSandbox || event.data?.sandboxId !== sandboxId) return;

      if (event.data.type === "console") {
        onConsoleMessage?.({ type: event.data.method, text: event.data.text });
        return;
      }
      if (event.data.type === "runtime-error") {
        onRuntimeError?.(event.data.message ?? "Unknown runtime error");
        return;
      }
      if (event.data.type === "height-change" && typeof event.data.height === "number") {
        onHeightChange?.(event.data.height);
        return;
      }
      if (event.data.type === "iframe-ready") {
        iframeReadyRef.current = true;
        if (pendingHtmlRef.current !== null) {
          iframe.contentWindow?.postMessage(
            { __mindfastUpdate: true, sandboxId, type: "update-html", html: pendingHtmlRef.current },
            "*"
          );
          pendingHtmlRef.current = null;
        }
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
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsoleMessage, onRuntimeError, onHeightChange, sandboxId]);

  // Debounced morphdom update via postMessage.
  useEffect(() => {
    const timer = setTimeout(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      if (!iframeReadyRef.current) {
        pendingHtmlRef.current = htmlContent;
        return;
      }
      iframe.contentWindow?.postMessage(
        { __mindfastUpdate: true, sandboxId, type: "update-html", html: htmlContent },
        "*"
      );
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [htmlContent, sandboxId]);

  return (
    <iframe
      ref={iframeRef}
      title="Artifact Preview"
      sandbox="allow-scripts allow-modals"
      srcDoc={initialSrcDocRef.current}
      className={className}
    />
  );
}
