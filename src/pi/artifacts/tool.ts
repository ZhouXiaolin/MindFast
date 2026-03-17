import type { Agent, AgentMessage } from "@mariozechner/pi-agent-core";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Type, StringEnum, type Static } from "@mariozechner/pi-ai";
import type { ArtifactsStore } from "./store";
import type { ArtifactMessage } from "./types";
import { ARTIFACTS_TOOL_DESCRIPTION } from "./description";

const artifactsParamsSchema = Type.Object({
  command: StringEnum(
    ["create", "update", "rewrite", "get", "delete", "logs"] as const,
    { description: "The operation to perform" }
  ),
  filename: Type.String({
    description: "Filename including extension (e.g., 'index.html', 'notes.md')",
  }),
  content: Type.Optional(Type.String({ description: "File content" })),
  old_str: Type.Optional(Type.String({ description: "String to replace (for update)" })),
  new_str: Type.Optional(Type.String({ description: "Replacement string (for update)" })),
});

export type ArtifactsParamsSchema = Static<typeof artifactsParamsSchema>;

export function createArtifactsTool(
  store: ArtifactsStore,
  getAgent: () => Agent | null
): AgentTool<typeof artifactsParamsSchema, undefined> {
  return {
    label: "Artifacts",
    name: "artifacts",
    description: ARTIFACTS_TOOL_DESCRIPTION,
    parameters: artifactsParamsSchema,
    execute: async (
      _toolCallId: string,
      args: ArtifactsParamsSchema,
      _signal?: AbortSignal
    ) => {
      const output = await store.executeCommand(args);
      const agent = getAgent();
      const cmd = args.command;
      if (agent && (cmd === "create" || cmd === "update" || cmd === "rewrite" || cmd === "delete")) {
        const msg: ArtifactMessage = {
          role: "artifact",
          action: cmd === "rewrite" ? "update" : cmd,
          filename: args.filename,
          timestamp: new Date().toISOString(),
        };
        if (cmd === "create" || cmd === "update" || cmd === "rewrite") {
          msg.content = args.content;
          if (cmd === "create") msg.title = args.filename;
        }
        agent.appendMessage(msg as AgentMessage);
      }
      return { content: [{ type: "text", text: output }], details: undefined };
    },
  };
}
