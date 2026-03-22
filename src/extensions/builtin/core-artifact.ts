import type { MindFastExtension } from "../types";

export const coreArtifact: MindFastExtension = {
  id: "core.artifact",
  name: "Artifacts",
  version: "0.1.0",
  enabledByDefault: true,
  contributes: {
    workspaceKinds: [{
      kind: "artifact",
      displayName: "Artifact",
      model: "document",
      sourceType: "workspace-file",
      match: { prefixes: ["artifacts/"] },
      presentation: {
        primarySurface: "sidebar.right",
        secondarySurfaces: ["detail.page", "list.card", "stream.attachment"],
        conflictMode: "replace",
        surfacePriority: 50,
        openPolicy: {
          activation: "auto",
          autoOpenOnNewItem: true,
        },
      },
    }],
  },
};
