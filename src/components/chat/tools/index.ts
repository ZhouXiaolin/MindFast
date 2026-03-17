import type { ToolResultMessage } from "@mariozechner/pi-ai";
import type { ArtifactsParams } from "../../../pi/artifacts/types";
import { renderDefaultTool } from "./DefaultRenderer";
import { renderArtifactsTool } from "./ArtifactsToolRenderer";
import type { ToolRenderResult } from "./types";

export type { ToolRenderResult, ToolRenderer } from "./types";
export { renderDefaultTool } from "./DefaultRenderer";
export { renderArtifactsTool } from "./ArtifactsToolRenderer";
export { ArtifactPill } from "./ArtifactPill";

export function renderTool(
  toolName: string,
  params: unknown,
  result: ToolResultMessage | undefined,
  isStreaming?: boolean,
  onOpenArtifact?: (filename: string) => void
): ToolRenderResult {
  if (toolName === "artifacts") {
    return renderArtifactsTool(
      toolName,
      params as ArtifactsParams | undefined,
      result,
      isStreaming,
      onOpenArtifact
    );
  }
  return renderDefaultTool(toolName, params, result, isStreaming);
}
