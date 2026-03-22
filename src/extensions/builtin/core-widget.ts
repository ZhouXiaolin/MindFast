import type { MindFastExtension } from "../types";

export const coreWidget: MindFastExtension = {
  id: "core.widget",
  name: "Widgets",
  version: "0.1.0",
  enabledByDefault: true,
  contributes: {
    workspaceKinds: [{
      kind: "widget",
      displayName: "Widget",
      model: "document",
      sourceType: "workspace-file",
      match: { prefixes: ["widgets/"] },
      presentation: {
        primarySurface: "stream.inline",
        secondarySurfaces: ["detail.page", "list.card"],
        conflictMode: "stack",
        surfacePriority: 100,
        openPolicy: {
          activation: "auto",
          autoOpenOnWrite: true,
        },
      },
    }],
  },
};
