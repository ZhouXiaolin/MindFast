/**
 * Artifact message type for session persistence.
 * Stored in conversation so we can reconstruct artifact state when loading a session.
 */
export interface ArtifactMessage {
  role: "artifact";
  action: "create" | "update" | "delete";
  filename: string;
  content?: string;
  title?: string;
  timestamp: string;
}

/**
 * Register artifact as a custom agent message so AgentMessage union includes it.
 */
declare module "@mariozechner/pi-agent-core" {
  interface CustomAgentMessages {
    artifact: ArtifactMessage;
  }
}

export interface Artifact {
  id: string;
  filename: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ArtifactsCommand = "create" | "update" | "rewrite" | "get" | "delete" | "logs";

export interface ArtifactsParams {
  command: ArtifactsCommand;
  filename: string;
  content?: string;
  old_str?: string;
  new_str?: string;
}

export function isArtifactMessage(msg: { role: string }): msg is ArtifactMessage {
  return msg.role === "artifact";
}
