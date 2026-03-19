import type { ToolResultMessage } from "@mariozechner/pi-ai";
import type { EditToolArgs, ReadToolArgs, WriteToolArgs } from "../../../ai/file-tools";
import type { BashToolArgs } from "../../../ai/tools";
import { renderDefaultTool } from "./DefaultRenderer";
import { renderReadTool } from "./ReadToolRenderer";
import { renderFileTool } from "./FileToolRenderer";
import { renderBashTool } from "./BashToolRenderer";
import { registerToolRenderer, getToolRenderer } from "./registry";
import type { ToolRenderResult } from "./types";

export type { ToolRenderResult, ToolRenderer } from "./types";
export { renderDefaultTool } from "./DefaultRenderer";
export { renderReadTool } from "./ReadToolRenderer";
export { renderFileTool } from "./FileToolRenderer";
export { renderBashTool } from "./BashToolRenderer";
export { ArtifactPill } from "./ArtifactPill";
export { registerToolRenderer, getToolRenderer } from "./registry";
export { SubagentToolProvider } from "./SubagentToolContext";

registerToolRenderer("read", {
  render(
    toolName: string,
    params: unknown,
    result: ToolResultMessage | undefined,
    isStreaming?: boolean
  ): ToolRenderResult {
    return renderReadTool(toolName, params as ReadToolArgs | undefined, result, isStreaming);
  },
});

registerToolRenderer("write", {
  render(
    _toolName: string,
    params: unknown,
    result: ToolResultMessage | undefined,
    isStreaming?: boolean,
    _toolCallId?: string,
    onOpenArtifact?: (filename: string) => void
  ): ToolRenderResult {
    return renderFileTool("write", params as WriteToolArgs | undefined, result, isStreaming, onOpenArtifact);
  },
});

registerToolRenderer("edit", {
  render(
    _toolName: string,
    params: unknown,
    result: ToolResultMessage | undefined,
    isStreaming?: boolean,
    _toolCallId?: string,
    onOpenArtifact?: (filename: string) => void
  ): ToolRenderResult {
    return renderFileTool("edit", params as EditToolArgs | undefined, result, isStreaming, onOpenArtifact);
  },
});

registerToolRenderer("bash", {
  render(
    toolName: string,
    params: unknown,
    result: ToolResultMessage | undefined,
    isStreaming?: boolean,
    toolCallId?: string
  ): ToolRenderResult {
    return renderBashTool(toolName, params as BashToolArgs | undefined, result, isStreaming, toolCallId);
  },
});

export function renderTool(
  toolName: string,
  params: unknown,
  result: ToolResultMessage | undefined,
  isStreaming?: boolean,
  toolCallId?: string,
  onOpenArtifact?: (filename: string) => void
): ToolRenderResult {
  const renderer = getToolRenderer(toolName);
  if (renderer) {
    return renderer.render(toolName, params, result, isStreaming, toolCallId, onOpenArtifact);
  }
  return renderDefaultTool(toolName, params, result, isStreaming);
}
