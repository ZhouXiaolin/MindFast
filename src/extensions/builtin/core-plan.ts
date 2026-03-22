import type { MindFastExtension } from "../types";

export const corePlan: MindFastExtension = {
  id: "core.plan",
  name: "Plans",
  version: "0.1.0",
  enabledByDefault: true,
  contributes: {
    workspaceKinds: [{
      kind: "plan",
      displayName: "Plan",
      model: "taskflow",
      sourceType: "workspace-file",
      match: { prefixes: ["plans/"], extensions: ["jsonl"] },
      presentation: {
        primarySurface: "rail.left",
        secondarySurfaces: ["detail.page"],
        conflictMode: "replace",
        surfacePriority: 100,
        openPolicy: {
          activation: "auto",
          autoOpenOnWrite: true,
          autoCloseWhenComplete: true,
          dismissOnNextUserTurnWhenComplete: true,
          replaceExisting: true,
          maxVisibleItems: 1,
        },
      },
    }],
  },
};
