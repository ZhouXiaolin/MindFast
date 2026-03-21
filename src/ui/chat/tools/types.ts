import type { ToolResultMessage } from "@mariozechner/pi-ai";
import type { ReactNode } from "react";

export interface ToolRenderResult {
  content: ReactNode;
  isCustom?: boolean; // true = no card wrapper
}

export interface ToolRenderer<TParams = unknown, TDetails = unknown> {
  render(
    toolName: string,
    params: TParams | undefined,
    result: ToolResultMessage<TDetails> | undefined,
    isStreaming?: boolean,
    toolCallId?: string,
    onOpenArtifact?: (filename: string) => void
  ): ToolRenderResult | null;
}
