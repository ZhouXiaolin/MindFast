/**
 * Artifacts: create/update/delete/get files alongside the conversation.
 * Session-persisted via ArtifactMessage; convertToLlm filters these out.
 * Extend types, store, or tool as needed for your app.
 */
export { ArtifactsStore } from "./store";
export { createArtifactsTool } from "./tool";
export { ARTIFACTS_TOOL_DESCRIPTION } from "./description";
export type { Artifact, ArtifactMessage, ArtifactsParams, ArtifactsCommand } from "./types";
export { isArtifactMessage } from "./types";
export type { ArtifactsParamsSchema } from "./tool";
