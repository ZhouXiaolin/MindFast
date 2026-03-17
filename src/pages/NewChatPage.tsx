import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createSessionId } from "../lib/workspace";

export function NewChatPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/chat/${createSessionId()}`, { replace: true });
  }, [navigate]);

  return (
    <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
      Loading…
    </div>
  );
}
