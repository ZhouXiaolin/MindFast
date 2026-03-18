import type { ToolResultMessage } from "@mariozechner/pi-ai";
import type { ArtifactsParams } from "../../../pi/artifacts/types";
import { renderDefaultTool } from "./DefaultRenderer";
import { renderArtifactsTool } from "./ArtifactsToolRenderer";
import { registerToolRenderer, getToolRenderer } from "./registry";
import type { ToolRenderResult } from "./types";

export type { ToolRenderResult, ToolRenderer } from "./types";
export { renderDefaultTool } from "./DefaultRenderer";
export { renderArtifactsTool } from "./ArtifactsToolRenderer";
export { ArtifactPill } from "./ArtifactPill";
export { registerToolRenderer, getToolRenderer } from "./registry";

// Register built-in tool renderers
registerToolRenderer("artifacts", {
  render(
    toolName: string,
    params: unknown,
    result: ToolResultMessage | undefined,
    isStreaming?: boolean,
    onOpenArtifact?: (filename: string) => void
  ): ToolRenderResult {
    return renderArtifactsTool(
      toolName,
      params as ArtifactsParams | undefined,
      result,
      isStreaming,
      onOpenArtifact
    );
  },
});

export function renderTool(
  toolName: string,
  params: unknown,
  result: ToolResultMessage | undefined,
  isStreaming?: boolean,
  onOpenArtifact?: (filename: string) => void
): ToolRenderResult {
  const renderer = getToolRenderer(toolName);
  if (renderer) {
    return renderer.render(toolName, params, result, isStreaming, onOpenArtifact);
  }
  return renderDefaultTool(toolName, params, result, isStreaming);
}
