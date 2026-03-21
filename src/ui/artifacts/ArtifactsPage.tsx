import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, FileCode2, FileText, Globe } from "lucide-react";
import { useSavedArtifacts } from "../hooks/useWorkspaceData";
import { MarkdownContent } from "../chat/MarkdownContent";
import { SandboxedIframe } from "./SandboxedIframe";
import type { SavedArtifactSummary } from "../../utils/workspace";

function ArtifactCardPreview({ artifact }: { artifact: SavedArtifactSummary }) {
  if (artifact.kind === "html") {
    return (
      <div className="h-44 overflow-hidden rounded-[1.25rem] border border-sidebar-soft bg-white">
        <SandboxedIframe
          htmlContent={artifact.content}
          className="h-full w-full border-0 pointer-events-none bg-white"
        />
      </div>
    );
  }

  if (artifact.kind === "markdown") {
    return (
      <div className="h-44 overflow-hidden rounded-[1.25rem] border border-sidebar-soft bg-sidebar-panel px-4 py-3">
        <MarkdownContent content={artifact.content} className="scale-[0.92] origin-top-left" />
      </div>
    );
  }

  return (
    <div className="h-44 overflow-hidden rounded-[1.25rem] border border-sidebar-soft bg-sidebar-panel p-4">
      <pre className="whitespace-pre-wrap break-words text-xs text-sidebar-muted">
        {artifact.previewText || artifact.content}
      </pre>
    </div>
  );
}

function ArtifactKindIcon({ kind }: { kind: SavedArtifactSummary["kind"] }) {
  if (kind === "html") return <Globe className="h-4 w-4" />;
  if (kind === "markdown") return <FileText className="h-4 w-4" />;
  return <FileCode2 className="h-4 w-4" />;
}

export function ArtifactsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { artifacts, loading } = useSavedArtifacts();

  return (
    <div className="flex h-full min-h-0 flex-col bg-app">
      <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-sidebar">{t("artifacts")}</h1>
          <p className="mt-1 text-sm text-sidebar-muted">{t("artifactsPageDescription")}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-[1.5rem] border border-sidebar-soft bg-sidebar-panel p-4 animate-pulse">
                  <div className="h-44 rounded-[1.25rem] bg-sidebar-soft" />
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-sidebar-soft" />
                    <div className="h-3 w-16 rounded-lg bg-sidebar-soft" />
                  </div>
                  <div className="mt-2 h-5 w-40 rounded-lg bg-sidebar-soft" />
                  <div className="mt-1 h-3 w-28 rounded-lg bg-sidebar-soft" />
                </div>
              ))}
            </div>
          ) : artifacts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {artifacts.map((artifact) => (
                <button
                  key={`${artifact.sessionId}:${artifact.artifactId}`}
                  type="button"
                  onClick={() =>
                    navigate(`/artifacts/${artifact.sessionId}/${encodeURIComponent(artifact.artifactId)}`)
                  }
                  className="rounded-[1.5rem] border border-sidebar-soft bg-sidebar-panel shadow-card p-4 text-left cursor-pointer transition-all duration-200 hover:bg-sidebar-panel-strong hover:shadow-card-md hover:-translate-y-px"
                >
                  <ArtifactCardPreview artifact={artifact} />
                  <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-sidebar-muted">
                    <ArtifactKindIcon kind={artifact.kind} />
                    <span>{artifact.kind}</span>
                  </div>
                  <div className="mt-2 truncate text-base font-medium text-sidebar">
                    {artifact.filename}
                  </div>
                  <div className="mt-1 truncate text-sm text-sidebar-muted">
                    {artifact.sessionTitle || t("untitledChat")}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-sidebar-soft bg-sidebar-panel px-6 text-center text-sm text-sidebar-muted">
              <div>
                <Box className="mx-auto mb-3 h-6 w-6" />
                <div>{t("noArtifactsYet")}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
