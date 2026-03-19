/**
 * Tool description for the widget tool. Widget = content shown directly in the conversation, not saved as file.
 */
export const WIDGET_TOOL_DESCRIPTION = `# Widget (show in chat)

Render content **directly in the conversation** so the user sees it inline. Use when the intent is to **display** something (demo, preview, chart, snippet), not to save a file.

## When to Use Widget
- Use when the user wants to **see** the result in the chat: "show me a demo", "render this", "display a chart", "preview this HTML".
- Good fits: small HTML/CSS demos, rendered markdown, inline SVG, data visualizations, interactive snippets.
- Do NOT use for "save as file", "create a file", "export" — use the artifacts tool instead.

## Parameters
- type: One of "html", "markdown", "svg", "image", "text". Determines how content is rendered.
- content: The raw content (HTML string, markdown, SVG, base64 image, or plain text).
- title: Optional short label for the widget (e.g. "Demo").`;
