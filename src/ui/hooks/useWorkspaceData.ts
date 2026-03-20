import { useEffect, useState } from "react";
import type { SessionMetadata } from "../../stores/storage";
import { getInitializedAppStorage } from "../../init";
import { useAppStore } from "../../stores/app";
import {
  extractArtifactsFromMessages,
  extractArtifactsFromSubtaskRuns,
  type SavedArtifactSummary,
} from "../../ai/artifacts/extract";
import {
  extractWidgetsFromMessages,
  extractWidgetsFromSubtaskRuns,
  type SavedWidgetSummary,
} from "../../ai/widgets/extract";

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

        const dedupedArtifacts = new Map<string, SavedArtifactSummary>();
        for (const artifact of allArtifacts) {
          const dedupeKey = `${artifact.sessionId}:${artifact.filename}`;
          const existing = dedupedArtifacts.get(dedupeKey);
          if (!existing || artifact.updatedAt > existing.updatedAt) {
            dedupedArtifacts.set(dedupeKey, artifact);
          }
        }

        const finalArtifacts = Array.from(dedupedArtifacts.values());
        finalArtifacts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

        if (!cancelled) {
          setArtifacts(finalArtifacts);
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

export function useSavedWidgets() {
  const workspaceRevision = useAppStore((state) => state.workspaceRevision);
  const [widgets, setWidgets] = useState<SavedWidgetSummary[]>([]);
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

        const allWidgets = sessions.flatMap(({ metadata, data, subtaskRuns }) => {
          const sessionTitle = metadata.title || data?.title || "Untitled chat";
          const messageWidgets = data
            ? extractWidgetsFromMessages(
              metadata.id,
              sessionTitle,
              metadata.lastModified,
              data.messages
            )
            : [];
          const subtaskWidgets = extractWidgetsFromSubtaskRuns(
            metadata.id,
            sessionTitle,
            metadata.lastModified,
            subtaskRuns
          );

          return [...messageWidgets, ...subtaskWidgets];
        });

        const dedupedWidgets = new Map<string, SavedWidgetSummary>();
        for (const widget of allWidgets) {
          const dedupeKey = `${widget.sessionId}:${widget.filename}`;
          const existing = dedupedWidgets.get(dedupeKey);
          if (!existing || widget.updatedAt > existing.updatedAt) {
            dedupedWidgets.set(dedupeKey, widget);
          }
        }

        const finalWidgets = Array.from(dedupedWidgets.values());
        finalWidgets.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

        if (!cancelled) {
          setWidgets(finalWidgets);
        }
      } catch (error) {
        console.error("Failed to load widgets:", error);
        if (!cancelled) {
          setWidgets([]);
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

  return { widgets, loading };
}
