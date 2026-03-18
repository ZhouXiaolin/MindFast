import type { ToolRenderer } from "./types";

const toolRenderers = new Map<string, ToolRenderer>();

export function registerToolRenderer(toolName: string, renderer: ToolRenderer): void {
  toolRenderers.set(toolName, renderer);
}

export function getToolRenderer(toolName: string): ToolRenderer | undefined {
  return toolRenderers.get(toolName);
}

export function unregisterToolRenderer(toolName: string): void {
  toolRenderers.delete(toolName);
}
