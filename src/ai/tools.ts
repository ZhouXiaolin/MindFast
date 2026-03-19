import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Type, type Static } from "@mariozechner/pi-ai";
import type { ExtendedAppStorage } from "../stores/init";
import { ArtifactsStore, formatWorkspaceEntries } from "./artifacts/store";
import { runSubtasks } from "./subtasks-tool";
import {
  BASH_TOOL_NAME,
  SUBAGENT_BASH_COMMAND,
  tryParseSubagentPayload,
  type BashCommandResultDetails,
  type BashSubagentResultDetails,
} from "./workspace-types";

const bashParamsSchema = Type.Object({
  command: Type.String({ description: "Shell command to simulate, for example ls artifacts, cat widgets/demo.html, or subagent" }),
  stdin: Type.Optional(Type.String({ description: "Optional stdin. For subagent, pass JSON like {\"subtasks\":[...]}." })),
});

type BashToolArgs = Static<typeof bashParamsSchema>;

function splitCommand(command: string): string[] {
  const matches = command.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  return matches.map((part) => {
    if (
      (part.startsWith("\"") && part.endsWith("\"")) ||
      (part.startsWith("'") && part.endsWith("'"))
    ) {
      return part.slice(1, -1);
    }
    return part;
  });
}

function runBashCommand(
  store: ArtifactsStore,
  args: BashToolArgs
): { text: string; details: BashCommandResultDetails } {
  const parts = splitCommand(args.command.trim());
  if (parts.length === 0) {
    return {
      text: "Error: bash command cannot be empty",
      details: { kind: "command", command: args.command },
    };
  }

  const [command, ...rest] = parts;
  switch (command) {
    case "pwd":
      return {
        text: "/",
        details: { kind: "command", command: args.command },
      };
    case "ls": {
      const targetPath = rest[0] ?? "";
      const entries = store.listEntries(targetPath);
      return {
        text: entries ? formatWorkspaceEntries(entries) : `Error: Path ${targetPath} not found`,
        details: { kind: "command", command: args.command },
      };
    }
    case "cat": {
      const targetPath = rest[0];
      return {
        text: targetPath ? store.readFile(targetPath) : "Error: cat requires a path",
        details: { kind: "command", command: args.command },
      };
    }
    case "find": {
      const targetPath = rest[0] ?? "";
      const query = rest[1] ?? "";
      return {
        text: formatWorkspaceEntries(store.findEntries(query, targetPath)),
        details: { kind: "command", command: args.command },
      };
    }
    case "mkdir": {
      const targetPath = rest.filter((part) => part !== "-p")[0];
      return {
        text: targetPath ? store.mkdir(targetPath) : "Error: mkdir requires a path",
        details: { kind: "command", command: args.command },
      };
    }
    case "help":
      return {
        text: [
          "Supported commands:",
          "pwd",
          "ls [path]",
          "cat <path>",
          "find [path] [query]",
          "mkdir -p <path>",
          "subagent  # provide JSON payload through stdin",
        ].join("\n"),
        details: { kind: "command", command: args.command },
      };
    default:
      return {
        text: `Error: Unsupported bash command ${command}`,
        details: { kind: "command", command: args.command },
      };
  }
}

export function createBashTool(
  storage: ExtendedAppStorage,
  store: ArtifactsStore,
  getAgent: () => import("@mariozechner/pi-agent-core").Agent | null
): AgentTool<typeof bashParamsSchema, BashCommandResultDetails | BashSubagentResultDetails> {
  return {
    label: "Bash",
    name: BASH_TOOL_NAME,
    description: "Run simulated shell commands for workspace inspection or subagent orchestration.",
    parameters: bashParamsSchema,
    execute: async (toolCallId: string, args: BashToolArgs, signal?: AbortSignal) => {
      if (args.command.trim() === SUBAGENT_BASH_COMMAND) {
        const payload = tryParseSubagentPayload(args.stdin);
        if (!payload) {
          return {
            content: [{
              type: "text",
              text: "Error: subagent requires JSON stdin in the form {\"subtasks\":[{\"id\":\"...\",\"label\":\"...\",\"prompt\":\"...\"}]}",
            }],
            details: { kind: "command", command: args.command },
          };
        }

        const result = await runSubtasks(toolCallId, payload.subtasks, storage, getAgent, signal);
        return {
          content: [{ type: "text", text: result.summaryText }],
          details: {
            kind: "subagent",
            completed: result.completed,
            failed: result.failed,
            total: result.total,
          },
        };
      }

      const result = runBashCommand(store, args);
      return {
        content: [{ type: "text", text: result.text }],
        details: result.details,
      };
    },
  };
}

export type { BashToolArgs };
