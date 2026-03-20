/**
 * Workspace file message type for session persistence.
 * Stored in conversation so we can reconstruct workspace state when loading a session.
 */
export interface WorkspaceFileMessage {
  role: "workspaceFile";
  action: "create" | "update" | "delete";
  filename: string;
  content?: string;
  title?: string;
  timestamp: string;
}

/**
 * Register workspace file messages as custom agent messages so AgentMessage union includes them.
 */
declare module "@mariozechner/pi-agent-core" {
  interface CustomAgentMessages {
    workspaceFile: WorkspaceFileMessage;
  }
}

export interface WorkspaceFile {
  id: string;
  filename: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspaceCommand = "create" | "update" | "rewrite" | "get" | "delete" | "logs";

export interface WorkspaceParams {
  command: WorkspaceCommand;
  filename: string;
  content?: string;
  old_str?: string;
  new_str?: string;
}

export function isWorkspaceFileMessage(msg: { role: string }): msg is WorkspaceFileMessage {
  return msg.role === "workspaceFile";
}
