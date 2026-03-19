export type WidgetContentType = "html" | "markdown" | "svg" | "image" | "text";

export interface WidgetParams {
  type: WidgetContentType;
  content: string;
  title?: string;
}
