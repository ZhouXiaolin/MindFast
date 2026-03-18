import type { ReactNode } from "react";

export type ArtifactFileType = "html" | "svg" | "markdown" | "image" | "pdf" | "excel" | "docx" | "text" | "generic";

export interface ArtifactRendererProps {
  filename: string;
  content: string;
}

export interface ArtifactHeaderAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function getFileType(filename: string): ArtifactFileType {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "svg") return "svg";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "pdf") return "pdf";
  if (ext === "xlsx" || ext === "xls") return "excel";
  if (ext === "docx") return "docx";
  if (
    ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" ||
    ext === "webp" || ext === "bmp" || ext === "ico"
  ) return "image";
  if ([
    "txt", "json", "xml", "yaml", "yml", "csv",
    "js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "h",
    "css", "scss", "sass", "less", "sh", "go", "rs", "rb",
    "swift", "kt", "sql", "r", "lua", "perl", "vue", "svelte", "toml",
  ].includes(ext || "")) return "text";
  return "generic";
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    html: "html", htm: "html", css: "css", scss: "scss", sass: "sass", less: "less",
    json: "json", py: "python", md: "markdown", svg: "xml", xml: "xml",
    yaml: "yaml", yml: "yaml", sh: "bash", bash: "bash", sql: "sql",
    java: "java", c: "c", cpp: "cpp", cs: "csharp", go: "go", rs: "rust",
    php: "php", rb: "ruby", swift: "swift", kt: "kotlin", r: "r",
    lua: "lua", perl: "perl", vue: "vue", svelte: "svelte", toml: "toml",
  };
  return map[ext || ""] || "text";
}
