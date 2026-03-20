const utf8Encoder = new TextEncoder();

export const DEFAULT_READ_MAX_LINES = 2000;
export const DEFAULT_READ_MAX_BYTES = 50 * 1024;

export interface TruncationResult {
  content: string;
  truncated: boolean;
  truncatedBy: "lines" | "bytes" | null;
  totalLines: number;
  totalBytes: number;
  outputLines: number;
  outputBytes: number;
  firstLineExceedsLimit: boolean;
}

export interface EditComputationResult {
  content: string;
  diff: string;
  firstChangedLine: number;
}

export function byteLength(text: string): number {
  return utf8Encoder.encode(text).length;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function truncateHead(
  content: string,
  maxLines = DEFAULT_READ_MAX_LINES,
  maxBytes = DEFAULT_READ_MAX_BYTES
): TruncationResult {
  const totalBytes = byteLength(content);
  const lines = content.split("\n");
  const totalLines = lines.length;

  if (totalLines <= maxLines && totalBytes <= maxBytes) {
    return {
      content,
      truncated: false,
      truncatedBy: null,
      totalLines,
      totalBytes,
      outputLines: totalLines,
      outputBytes: totalBytes,
      firstLineExceedsLimit: false,
    };
  }

  if (lines.length > 0 && byteLength(lines[0]) > maxBytes) {
    return {
      content: "",
      truncated: true,
      truncatedBy: "bytes",
      totalLines,
      totalBytes,
      outputLines: 0,
      outputBytes: 0,
      firstLineExceedsLimit: true,
    };
  }

  const outputLines: string[] = [];
  let usedBytes = 0;
  let truncatedBy: "lines" | "bytes" = "lines";

  for (let index = 0; index < lines.length && index < maxLines; index += 1) {
    const line = lines[index];
    const lineBytes = byteLength(line) + (index > 0 ? 1 : 0);
    if (usedBytes + lineBytes > maxBytes) {
      truncatedBy = "bytes";
      break;
    }

    outputLines.push(line);
    usedBytes += lineBytes;
  }

  if (outputLines.length >= maxLines && usedBytes <= maxBytes) {
    truncatedBy = "lines";
  }

  const truncatedContent = outputLines.join("\n");

  return {
    content: truncatedContent,
    truncated: true,
    truncatedBy,
    totalLines,
    totalBytes,
    outputLines: outputLines.length,
    outputBytes: byteLength(truncatedContent),
    firstLineExceedsLimit: false,
  };
}

export function detectLineEnding(content: string): "\r\n" | "\n" {
  const crlfIndex = content.indexOf("\r\n");
  const lfIndex = content.indexOf("\n");

  if (lfIndex === -1 || crlfIndex === -1) {
    return "\n";
  }

  return crlfIndex < lfIndex ? "\r\n" : "\n";
}

export function normalizeToLF(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function restoreLineEndings(text: string, lineEnding: "\r\n" | "\n"): string {
  return lineEnding === "\r\n" ? text.replace(/\n/g, "\r\n") : text;
}

export function normalizeForFuzzyMatch(text: string): string {
  return text
    .normalize("NFKC")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, "\"")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/[\u00A0\u2002-\u200A\u202F\u205F\u3000]/g, " ");
}

function stripBom(content: string): { bom: string; text: string } {
  return content.startsWith("\uFEFF")
    ? { bom: "\uFEFF", text: content.slice(1) }
    : { bom: "", text: content };
}

function findFuzzyMatch(
  content: string,
  oldText: string
): { contentForReplacement: string; index: number; matchLength: number } | null {
  const exactIndex = content.indexOf(oldText);
  if (exactIndex >= 0) {
    return {
      contentForReplacement: content,
      index: exactIndex,
      matchLength: oldText.length,
    };
  }

  const fuzzyContent = normalizeForFuzzyMatch(content);
  const fuzzyOldText = normalizeForFuzzyMatch(oldText);
  const fuzzyIndex = fuzzyContent.indexOf(fuzzyOldText);
  if (fuzzyIndex < 0) {
    return null;
  }

  return {
    contentForReplacement: fuzzyContent,
    index: fuzzyIndex,
    matchLength: fuzzyOldText.length,
  };
}

function countOccurrences(content: string, query: string): number {
  if (!query) {
    return 0;
  }

  let count = 0;
  let offset = 0;
  while (offset <= content.length) {
    const index = content.indexOf(query, offset);
    if (index < 0) {
      break;
    }
    count += 1;
    offset = index + query.length;
  }

  return count;
}

function generateDiffSnippet(oldText: string, newText: string, firstChangedLine: number): string {
  const oldLines = normalizeToLF(oldText).split("\n");
  const newLines = normalizeToLF(newText).split("\n");
  const maxLineNumber = firstChangedLine + Math.max(oldLines.length, newLines.length) - 1;
  const lineNumberWidth = String(Math.max(firstChangedLine, maxLineNumber)).length;

  return [
    ...oldLines.map((line, index) => `-${String(firstChangedLine + index).padStart(lineNumberWidth, " ")} ${line}`),
    ...newLines.map((line, index) => `+${String(firstChangedLine + index).padStart(lineNumberWidth, " ")} ${line}`),
  ].join("\n");
}

export function computeEdit(
  currentContent: string,
  oldText: string,
  newText: string
): EditComputationResult {
  if (!oldText) {
    throw new Error("edit requires old_str");
  }

  const { bom, text } = stripBom(currentContent);
  const lineEnding = detectLineEnding(text);
  const normalizedContent = normalizeToLF(text);
  const normalizedOldText = normalizeToLF(oldText);
  const normalizedNewText = normalizeToLF(newText);

  const match = findFuzzyMatch(normalizedContent, normalizedOldText);
  if (!match) {
    throw new Error("Could not find the exact text in the file. old_str must match exactly.");
  }

  const fuzzyContent = normalizeForFuzzyMatch(normalizedContent);
  const fuzzyOldText = normalizeForFuzzyMatch(normalizedOldText);
  const occurrences = countOccurrences(fuzzyContent, fuzzyOldText);
  if (occurrences > 1) {
    throw new Error(`Found ${occurrences} matches for old_str. Provide more surrounding context so the match is unique.`);
  }

  const contentForReplacement = match.contentForReplacement;
  const nextContent =
    contentForReplacement.slice(0, match.index) +
    normalizedNewText +
    contentForReplacement.slice(match.index + match.matchLength);

  if (nextContent === contentForReplacement) {
    throw new Error("No changes made. The replacement produced identical content.");
  }

  const firstChangedLine = contentForReplacement.slice(0, match.index).split("\n").length;

  return {
    content: bom + restoreLineEndings(nextContent, lineEnding),
    diff: generateDiffSnippet(
      contentForReplacement.slice(match.index, match.index + match.matchLength),
      normalizedNewText,
      firstChangedLine
    ),
    firstChangedLine,
  };
}
