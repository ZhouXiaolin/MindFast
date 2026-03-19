import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Type, StringEnum, type Static } from "@mariozechner/pi-ai";
import { WIDGET_TOOL_DESCRIPTION } from "./description";

const widgetParamsSchema = Type.Object({
  type: StringEnum(
    ["html", "markdown", "svg", "image", "text"] as const,
    { description: "How to render the content in the chat" }
  ),
  content: Type.String({ description: "The content to display (HTML, markdown, SVG, base64 image, or plain text)" }),
  title: Type.Optional(Type.String({ description: "Optional short label for the widget" })),
});

export type WidgetParamsSchema = Static<typeof widgetParamsSchema>;

export function createWidgetTool(): AgentTool<typeof widgetParamsSchema, undefined> {
  return {
    label: "Widget",
    name: "widget",
    description: WIDGET_TOOL_DESCRIPTION,
    parameters: widgetParamsSchema,
    execute: async (
      _toolCallId: string,
      _args: WidgetParamsSchema,
      _signal?: AbortSignal
    ) => {
      return {
        content: [{ type: "text", text: "Displayed in chat." }],
        details: undefined,
      };
    },
  };
}
