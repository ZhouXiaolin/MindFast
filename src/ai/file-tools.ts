import { Agent } from "@mariozechner/pi-agent-core";
import type { AgentMessage, AgentTool } from "@mariozechner/pi-agent-core";
import { Type, type Static } from "@mariozechner/pi-ai";
import {
  DEFAULT_READ_MAX_BYTES,
  DEFAULT_READ_MAX_LINES,
  formatSize,
  truncateHead,
} from "./workspace/file-tool-utils";
import { WorkspaceStore } from "./workspace/store";
import type { WorkspaceFileMessage } from "./workspace/types";
import type { FileToolResultDetails } from "./workspace-types";

const readParamsSchema = Type.Object({
  path: Type.String({ description: "Workspace path to read, for example artifacts/report.md" }),
  offset: Type.Optional(Type.Number({ description: "Line number to start reading from (1-indexed)" })),
  limit: Type.Optional(Type.Number({ description: "Maximum number of lines to read" })),
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

interface ReadToolDetails {
  truncation?: ReturnType<typeof truncateHead>;
}

function persistWorkspaceFileMessage(
  agent: Agent | null,
  action: WorkspaceFileMessage["action"],
  filename: string,
  content?: string
): void {
  if (!agent) return;

  const message: WorkspaceFileMessage = {
    role: "workspaceFile",
    action,
    filename,
    timestamp: new Date().toISOString(),
  };
  if (content !== undefined) {
    message.content = content;
  }
  agent.appendMessage(message as AgentMessage);
}

export function createReadTool(store: WorkspaceStore): AgentTool<typeof readParamsSchema, ReadToolDetails | undefined> {
  return {
    label: "Read",
    name: "read",
    description: `Read a workspace file. Output is truncated to ${DEFAULT_READ_MAX_LINES} lines or ${Math.floor(DEFAULT_READ_MAX_BYTES / 1024)}KB. Use offset and limit to continue reading large files.`,
    parameters: readParamsSchema,
    execute: async (_toolCallId: string, args: ReadToolArgs) => {
      if (args.offset !== undefined && (!Number.isInteger(args.offset) || args.offset < 1)) {
        throw new Error("offset must be a positive integer.");
      }

      if (args.limit !== undefined && (!Number.isInteger(args.limit) || args.limit < 1)) {
        throw new Error("limit must be a positive integer.");
      }

      const file = store.getFile(args.path);
      const allLines = file.content.split("\n");
      const startLine = args.offset ? args.offset - 1 : 0;
      if (startLine >= allLines.length) {
        throw new Error(`Offset ${args.offset} is beyond end of file (${allLines.length} lines total).`);
      }

      const selectedLines = args.limit !== undefined
        ? allLines.slice(startLine, Math.min(startLine + args.limit, allLines.length))
        : allLines.slice(startLine);
      const selectedContent = selectedLines.join("\n");
      const truncation = truncateHead(selectedContent);
      const startLineDisplay = startLine + 1;

      let outputText = truncation.content;
      let details: ReadToolDetails | undefined;

      if (truncation.firstLineExceedsLimit) {
        const firstLineSize = formatSize(new TextEncoder().encode(allLines[startLine]).length);
        outputText = `[Line ${startLineDisplay} is ${firstLineSize}, which exceeds the ${formatSize(DEFAULT_READ_MAX_BYTES)} read limit. Narrow the read with a different offset or inspect the file through a more targeted edit.]`;
        details = { truncation };
      } else if (truncation.truncated) {
        const endLineDisplay = startLineDisplay + truncation.outputLines - 1;
        const nextOffset = endLineDisplay + 1;
        outputText += truncation.truncatedBy === "lines"
          ? `\n\n[Showing lines ${startLineDisplay}-${endLineDisplay} of ${allLines.length}. Use offset=${nextOffset} to continue.]`
          : `\n\n[Showing lines ${startLineDisplay}-${endLineDisplay} of ${allLines.length} (${formatSize(DEFAULT_READ_MAX_BYTES)} limit). Use offset=${nextOffset} to continue.]`;
        details = { truncation };
      } else if (args.limit !== undefined && startLine + selectedLines.length < allLines.length) {
        outputText += `\n\n[${allLines.length - (startLine + selectedLines.length)} more lines in file. Use offset=${startLine + selectedLines.length + 1} to continue.]`;
      }

      return {
        content: [{ type: "text", text: outputText }],
        details,
      };
    },
  };
}

export function createWriteTool(
  store: WorkspaceStore,
  getAgent: () => Agent | null
): AgentTool<typeof writeParamsSchema, FileToolResultDetails | undefined> {
  return {
    label: "Write",
    name: "write",
    description: "Create or overwrite a workspace file with full content.",
    parameters: writeParamsSchema,
    execute: async (toolCallId: string, args: WriteToolArgs) => {
      const result = store.writeFile(args.path, args.content, toolCallId);
      persistWorkspaceFileMessage(getAgent(), result.action, result.file.filename, result.file.content);

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
  store: WorkspaceStore,
  getAgent: () => Agent | null
): AgentTool<typeof editParamsSchema, FileToolResultDetails | undefined> {
  return {
    label: "Edit",
    name: "edit",
    description: "Edit a workspace file by replacing exact text.",
    parameters: editParamsSchema,
    execute: async (_toolCallId: string, args: EditToolArgs) => {
      const result = store.editFile(args.path, args.old_str, args.new_str);
      persistWorkspaceFileMessage(getAgent(), "update", result.file.filename, result.file.content);

      return {
        content: [{ type: "text", text: result.message }],
        details: {
          path: result.file.filename,
          content: result.file.content,
          action: "update",
          diff: result.diff,
          firstChangedLine: result.firstChangedLine,
        },
      };
    },
  };
}

export type { EditToolArgs, ReadToolArgs, WriteToolArgs };
