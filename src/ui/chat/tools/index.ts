import type { ToolResultMessage } from "@mariozechner/pi-ai";
import type { ArtifactsParams } from "../../../ai/artifacts/types";
import type { WidgetParamsSchema } from "../../../ai/widget/tool";
import type { SubtasksToolParams } from "../../../ai/subagent-types";
import { SUBAGENT_TOOL_NAME } from "../../../ai/subagent-types";
import { renderDefaultTool } from "./DefaultRenderer";
import { renderArtifactsTool } from "./ArtifactsToolRenderer";
import { renderWidgetTool } from "./WidgetToolRenderer";
import { renderSubagentTool } from "./SubagentToolRenderer";
import { registerToolRenderer, getToolRenderer } from "./registry";
import type { ToolRenderResult } from "./types";

export type { ToolRenderResult, ToolRenderer } from "./types";
export { renderDefaultTool } from "./DefaultRenderer";
export { renderArtifactsTool } from "./ArtifactsToolRenderer";
export { renderWidgetTool } from "./WidgetToolRenderer";
export { renderSubagentTool } from "./SubagentToolRenderer";
export { ArtifactPill } from "./ArtifactPill";
export { registerToolRenderer, getToolRenderer } from "./registry";
// Re-export SubagentToolProvider for external use
export { SubagentToolProvider } from "./SubagentToolContext";

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

registerToolRenderer("widget", {
  render(
    toolName: string,
    params: unknown,
    result: ToolResultMessage | undefined,
    isStreaming?: boolean,
    _onOpenArtifact?: (filename: string) => void
  ): ToolRenderResult {
    return renderWidgetTool(
      toolName,
      params as WidgetParamsSchema | undefined,
      result,
      isStreaming
    );
  },
});

registerToolRenderer(SUBAGENT_TOOL_NAME, {
  render(
    toolName: string,
    params: unknown,
    result: ToolResultMessage | undefined,
    isStreaming?: boolean,
    _onOpenArtifact?: (filename: string) => void
  ): ToolRenderResult {
    return renderSubagentTool(
      toolName,
      params as SubtasksToolParams | undefined,
      result,
      isStreaming
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
