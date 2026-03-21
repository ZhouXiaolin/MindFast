import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArtifactPreview } from "./ArtifactPreview";
import { useSavedArtifacts } from "../hooks/useWorkspaceData";

export function ArtifactDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId, artifactId } = useParams<{ sessionId: string; artifactId: string }>();
  const { artifacts, loading } = useSavedArtifacts();

  const decodedArtifactId = artifactId ? decodeURIComponent(artifactId) : null;
  const artifact = artifacts.find(
    (item) =>
      item.sessionId === sessionId &&
      (item.artifactId === decodedArtifactId || item.filename === decodedArtifactId)
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-sidebar-muted border-t-accent" />
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        {t("artifactNotFound")}
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
              onClick={() => navigate("/artifacts")}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-sidebar-soft bg-sidebar-panel px-3 py-1.5 text-sm text-sidebar cursor-pointer transition-all duration-200 hover:bg-sidebar-panel-strong"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t("artifacts")}</span>
            </button>
            <h1 className="text-2xl font-semibold text-sidebar">{artifact.filename}</h1>
            <p className="mt-1 text-sm text-sidebar-muted">{artifact.sessionTitle}</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden rounded-[1.75rem] border border-sidebar-soft bg-sidebar-panel">
          <ArtifactPreview filename={artifact.filename} content={artifact.content} />
        </div>
      </div>
    </div>
  );
}
