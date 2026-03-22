import type { MindFastExtension } from "../types";

export const coreSubagentPlan: MindFastExtension = {
  id: "core.subagent-plan",
  name: "Subagent Plan",
  version: "0.1.0",
  enabledByDefault: true,
  contributes: {
    workspaceKinds: [{
      kind: "subagent-plan",
      displayName: "Subagent Plan",
      model: "taskflow",
      sourceType: "runtime-store",
      presentation: {
        primarySurface: "sidebar.right",
        secondarySurfaces: ["detail.page"],
        conflictMode: "replace",
        surfacePriority: 100,
        openPolicy: {
          activation: "auto",
          autoOpenOnNewItem: true,
          autoCloseWhenComplete: false,
        },
      },
    }],
  },
};
