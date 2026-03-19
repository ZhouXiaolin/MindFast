import { Agent } from "@mariozechner/pi-agent-core";
import type { AgentMessage, AgentTool } from "@mariozechner/pi-agent-core";
import { Type, type Static } from "@mariozechner/pi-ai";
import { ArtifactsStore } from "./artifacts/store";
import type { ArtifactMessage } from "./artifacts/types";
import type { FileToolResultDetails } from "./workspace-types";

const readParamsSchema = Type.Object({
  path: Type.String({ description: "Workspace path to read, for example artifacts/report.md" }),
});

const writeParamsSchema = Type.Object({
  path: Type.String({ description: "Workspace path to write, for example artifacts/report.md or widgets/demo.html" }),
  content: Type.String({ description: "Full file content to write" }),
});

const editParamsSchema = Type.Object({
  path: Type.String({ description: "Workspace path to edit" }),
  old_str: Type.String({ description: "Exact text to replace" }),
  new_str: Type.String({ description: "Replacement text" }),
});

type ReadToolArgs = Static<typeof readParamsSchema>;
type WriteToolArgs = Static<typeof writeParamsSchema>;
type EditToolArgs = Static<typeof editParamsSchema>;

function appendArtifactMessage(
  agent: Agent | null,
  action: ArtifactMessage["action"],
  filename: string,
  content?: string
): void {
  if (!agent) return;

  const message: ArtifactMessage = {
    role: "artifact",
    action,
    filename,
    timestamp: new Date().toISOString(),
  };
  if (content !== undefined) {
    message.content = content;
  }
  agent.appendMessage(message as AgentMessage);
}

export function createReadTool(store: ArtifactsStore): AgentTool<typeof readParamsSchema, undefined> {
  return {
    label: "Read",
    name: "read",
    description: "Read the full contents of a workspace file.",
    parameters: readParamsSchema,
    execute: async (_toolCallId: string, args: ReadToolArgs) => {
      return {
        content: [{ type: "text", text: store.readFile(args.path) }],
        details: undefined,
      };
    },
  };
}

export function createWriteTool(
  store: ArtifactsStore,
  getAgent: () => Agent | null
): AgentTool<typeof writeParamsSchema, FileToolResultDetails | undefined> {
  return {
    label: "Write",
    name: "write",
    description: "Create or overwrite a workspace file with full content.",
    parameters: writeParamsSchema,
    execute: async (_toolCallId: string, args: WriteToolArgs) => {
      const result = store.writeFile(args.path, args.content);
      if (typeof result === "string") {
        return {
          content: [{ type: "text", text: result }],
          details: undefined,
        };
      }

      appendArtifactMessage(getAgent(), result.action, result.file.filename, result.file.content);

      return {
        content: [{ type: "text", text: result.message }],
        details: {
          path: result.file.filename,
          content: result.file.content,
          action: result.action,
        },
      };
    },
  };
}

export function createEditTool(
  store: ArtifactsStore,
  getAgent: () => Agent | null
): AgentTool<typeof editParamsSchema, FileToolResultDetails | undefined> {
  return {
    label: "Edit",
    name: "edit",
    description: "Edit a workspace file by replacing exact text.",
    parameters: editParamsSchema,
    execute: async (_toolCallId: string, args: EditToolArgs) => {
      const result = store.editFile(args.path, args.old_str, args.new_str);
      if (typeof result === "string") {
        return {
          content: [{ type: "text", text: result }],
          details: undefined,
        };
      }

      appendArtifactMessage(getAgent(), "update", result.file.filename, result.file.content);

      return {
        content: [{ type: "text", text: result.message }],
        details: {
          path: result.file.filename,
          content: result.file.content,
          action: "update",
        },
      };
    },
  };
}

export type { EditToolArgs, ReadToolArgs, WriteToolArgs };
