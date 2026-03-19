import { useEffect, useState } from "react";
import type { SessionMetadata } from "../../stores/storage";
import { getInitializedAppStorage } from "../../init";
import { useAppStore } from "../../stores/app";
import {
  extractArtifactsFromMessages,
  extractArtifactsFromSubtaskRuns,
  type SavedArtifactSummary,
} from "../../ai/artifacts/extract";

export function useSessionMetadataList() {
  const workspaceRevision = useAppStore((state) => state.workspaceRevision);
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const storage = await getInitializedAppStorage();
        const metadata = await storage.sessions.getAllMetadata();
        if (!cancelled) {
          setSessions(metadata);
        }
      } catch (error) {
        console.error("Failed to load sessions metadata:", error);
        if (!cancelled) {
          setSessions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [workspaceRevision]);

  return { sessions, loading };
}

export function useSavedArtifacts() {
  const workspaceRevision = useAppStore((state) => state.workspaceRevision);
  const [artifacts, setArtifacts] = useState<SavedArtifactSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const storage = await getInitializedAppStorage();
        const metadataList = await storage.sessions.getAllMetadata();
        const sessions = await Promise.all(
          metadataList.map(async (metadata) => {
            const data = await storage.sessions.loadSession(metadata.id);
            const subtaskRuns = await storage.subtaskRuns.getSessionRuns(metadata.id);
            return { metadata, data, subtaskRuns };
          })
        );

        const allArtifacts = sessions.flatMap(({ metadata, data, subtaskRuns }) => {
          const sessionTitle = metadata.title || data?.title || "Untitled chat";
          const messageArtifacts = data
            ? extractArtifactsFromMessages(
              metadata.id,
              sessionTitle,
              metadata.lastModified,
              data.messages
            )
            : [];
          const subtaskArtifacts = extractArtifactsFromSubtaskRuns(
            metadata.id,
            sessionTitle,
            metadata.lastModified,
            subtaskRuns
          );

          return [...messageArtifacts, ...subtaskArtifacts];
        });

        allArtifacts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

        if (!cancelled) {
          setArtifacts(allArtifacts);
        }
      } catch (error) {
        console.error("Failed to load artifacts:", error);
        if (!cancelled) {
          setArtifacts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [workspaceRevision]);

  return { artifacts, loading };
}
