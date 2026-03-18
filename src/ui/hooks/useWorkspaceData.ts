import { useEffect, useState } from "react";
import type { SessionMetadata } from "../../stores/storage";
import { getAppStorage, initApp } from "../../init";
import { useAppStore } from "../../stores/app";
import {
  extractArtifactsFromMessages,
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
        await initApp();
        const storage = getAppStorage();
        if (!storage) return;

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
        await initApp();
        const storage = getAppStorage();
        if (!storage) return;

        const metadataList = await storage.sessions.getAllMetadata();
        const sessions = await Promise.all(
          metadataList.map(async (metadata) => {
            const data = await storage.sessions.loadSession(metadata.id);
            return { metadata, data };
          })
        );

        const allArtifacts = sessions.flatMap(({ metadata, data }) => {
          if (!data) return [];
          return extractArtifactsFromMessages(
            metadata.id,
            metadata.title || data.title || "Untitled chat",
            metadata.lastModified,
            data.messages
          );
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
