import { Code2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSavedWidgets } from "../hooks/useWorkspaceData";

export function WidgetsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { widgets, loading } = useSavedWidgets();

  return (
    <div className="flex h-full min-h-0 flex-col bg-app">
      <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-sidebar">{t("widgets")}</h1>
          <p className="mt-1 text-sm text-sidebar-muted">{t("widgetsPageDescription")}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sidebar-muted">
              Loading…
            </div>
          ) : widgets.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {widgets.map((widget) => (
                <button
                  key={`${widget.sessionId}:${widget.widgetId}`}
                  type="button"
                  onClick={() =>
                    navigate(`/widgets/${widget.sessionId}/${encodeURIComponent(widget.widgetId)}`)
                  }
                  className="rounded-[1.5rem] border border-sidebar-soft bg-sidebar-panel p-4 text-left transition-colors hover:bg-sidebar-panel-strong"
                >
                  <div className="h-44 overflow-hidden rounded-[1.25rem] border border-sidebar-soft bg-app p-4">
                    <pre className="whitespace-pre-wrap break-words text-xs text-sidebar-muted">
                      {widget.previewText || widget.content}
                    </pre>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-sidebar-muted">
                    <Code2 className="h-4 w-4" />
                    <span>source</span>
                  </div>
                  <div className="mt-2 truncate text-base font-medium text-sidebar">
                    {widget.filename}
                  </div>
                  <div className="mt-1 truncate text-sm text-sidebar-muted">
                    {widget.sessionTitle || t("untitledChat")}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-sidebar-soft bg-sidebar-panel px-6 text-center text-sm text-sidebar-muted">
              <div>
                <Code2 className="mx-auto mb-3 h-6 w-6" />
                <div>{t("noWidgetsYet")}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
