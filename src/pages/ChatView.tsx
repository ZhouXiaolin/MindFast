import { useEffect, useRef, useState } from "react";
import { createChatPanel } from "../pi/initPi";
import type { ChatPanel } from "@mariozechner/pi-web-ui";

export function ChatView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<ChatPanel | null>(null);

  useEffect(() => {
    let mounted = true;
    const el = containerRef.current;
    if (!el) return;

    createChatPanel()
      .then((chatPanel) => {
        if (!mounted || !containerRef.current) return;
        panelRef.current = chatPanel;
        el.appendChild(chatPanel);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      mounted = false;
      if (panelRef.current && el.contains(panelRef.current)) {
        el.removeChild(panelRef.current);
        panelRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col"
      style={{ minHeight: 0 }}
    />
  );
}
