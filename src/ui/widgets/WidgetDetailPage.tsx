import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "../chat/CodeBlock";
import { useSavedWidgets } from "../hooks/useWorkspaceData";

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    css: "css",
    html: "html",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    py: "python",
    sh: "bash",
    svg: "svg",
    ts: "typescript",
    tsx: "typescript",
    yaml: "yaml",
    yml: "yaml",
  };
  return map[ext ?? ""] ?? "text";
}

export function WidgetDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId, widgetId } = useParams<{ sessionId: string; widgetId: string }>();
  const { widgets, loading } = useSavedWidgets();

  const decodedWidgetId = widgetId ? decodeURIComponent(widgetId) : null;
  const widget = widgets.find(
    (item) =>
      item.sessionId === sessionId &&
      (item.widgetId === decodedWidgetId || item.filename === decodedWidgetId)
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-sidebar-muted border-t-accent" />
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        {t("widgetNotFound")}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-app">
      <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col px-6 py-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate("/widgets")}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-sidebar-soft bg-sidebar-panel px-3 py-1.5 text-sm text-sidebar cursor-pointer transition-all duration-200 hover:bg-sidebar-panel-strong"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t("widgets")}</span>
            </button>
            <h1 className="text-2xl font-semibold text-sidebar">{widget.filename}</h1>
            <p className="mt-1 text-sm text-sidebar-muted">{widget.sessionTitle}</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto rounded-[1.75rem] border border-sidebar-soft bg-sidebar-panel p-4">
          <CodeBlock
            code={widget.content}
            language={getLanguageFromFilename(widget.filename)}
            className="h-full border-0 bg-app/40"
          />
        </div>
      </div>
    </div>
  );
}
