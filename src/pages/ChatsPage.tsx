import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquarePlus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSessionMetadataList } from "../hooks/useWorkspaceData";
import { cn } from "../lib/cn";
import { createSessionId } from "../lib/workspace";

interface ChatsPageProps {
  autoFocusSearch?: boolean;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export function ChatsPage({ autoFocusSearch = false }: ChatsPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { sessions, loading } = useSessionMetadataList();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!autoFocusSearch) return;
    searchInputRef.current?.focus();
  }, [autoFocusSearch]);

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sessions;

    return sessions.filter((session) => {
      const haystack = `${session.title} ${session.preview}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, sessions]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-app">
      <div className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col px-6 py-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sidebar">{t("chats")}</h1>
            <p className="mt-1 text-sm text-sidebar-muted">{t("chatsPageDescription")}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/chat/${createSessionId()}`)}
            className="inline-flex items-center gap-2 rounded-full border border-sidebar-soft bg-sidebar-panel px-4 py-2 text-sm text-sidebar transition-colors hover:bg-sidebar-panel-strong"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>{t("newChat")}</span>
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-[1.25rem] border border-sidebar-soft bg-sidebar-panel px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-sidebar-muted" />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchChatsPlaceholder")}
            className="w-full bg-transparent text-sm text-sidebar outline-none placeholder:text-sidebar-muted"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sidebar-muted">
              Loading…
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => navigate(`/chat/${session.id}`)}
                  className={cn(
                    "w-full rounded-[1.5rem] border border-sidebar-soft bg-sidebar-panel px-5 py-4 text-left transition-colors",
                    "hover:bg-sidebar-panel-strong"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium text-sidebar">
                        {session.title || t("untitledChat")}
                      </div>
                      <div className="mt-2 max-h-11 overflow-hidden text-sm text-sidebar-muted">
                        {session.preview || t("noChatsPreview")}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-sidebar-muted">
                      <div>{formatTimestamp(session.lastModified)}</div>
                      <div className="mt-2">
                        {t("messagesCount", { count: session.messageCount })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-sidebar-soft bg-sidebar-panel px-6 text-center text-sm text-sidebar-muted">
              {sessions.length === 0 ? t("noChatsYet") : t("noChatsMatch")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
