import type { ToolResultMessage } from "@mariozechner/pi-ai";
import type { WidgetParamsSchema } from "../../../ai/widget/tool";
import { InlineArtifactPreview } from "../../artifacts/InlineArtifactPreview";
import type { ToolRenderResult } from "./types";

function filenameFromWidgetType(type: string): string {
  const ext =
    type === "html" ? "html"
    : type === "markdown" ? "md"
    : type === "svg" ? "svg"
    : type === "image" ? "png"
    : "txt";
  return `preview.${ext}`;
}

export function renderWidgetTool(
  _toolName: string,
  params: WidgetParamsSchema | undefined,
  _result: ToolResultMessage | undefined,
  isStreaming?: boolean
): ToolRenderResult {
  const state = _result
    ? (_result as { isError?: boolean }).isError
      ? "error"
      : "complete"
    : isStreaming
      ? "inprogress"
      : "complete";

  if (!params?.content) {
    return {
      content: (
        <div className="rounded-2xl border border-sidebar-soft bg-sidebar-panel px-3 py-3 text-sm text-sidebar-muted">
          {state === "inprogress" ? "Preparing…" : "No content to display."}
        </div>
      ),
      isCustom: true,
    };
  }

  const filename = filenameFromWidgetType(params.type ?? "text");
  return {
    content: (
      <div className="rounded-2xl border border-sidebar-soft bg-sidebar-panel overflow-hidden">
        {params.title ? (
          <div className="border-b border-sidebar-soft px-3 py-2 text-xs font-medium text-sidebar-muted">
            {params.title}
          </div>
        ) : null}
        <div className="p-2">
          <InlineArtifactPreview
            filename={filename}
            content={params.content}
            growWithContent
          />
        </div>
      </div>
    ),
    isCustom: true,
  };
}
