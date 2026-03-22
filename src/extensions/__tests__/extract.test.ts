import { describe, it, expect, beforeEach } from "vitest";
import { resetExtensionRegistry } from "../registry";
import { extractItemsByKind, extractItemsByKindFromSubtaskRuns } from "../extract";

describe("extractItemsByKind", () => {
  beforeEach(() => {
    resetExtensionRegistry();
  });

  it("returns empty for no messages", () => {
    const items = extractItemsByKind("artifact", "s1", "Test", "2026-01-01T00:00:00Z", []);
    expect(items).toHaveLength(0);
  });

  it("returns empty for non-matching kind", () => {
    const items = extractItemsByKind("widget", "s1", "Test", "2026-01-01T00:00:00Z", []);
    expect(items).toHaveLength(0);
  });
});

describe("extractItemsByKindFromSubtaskRuns", () => {
  beforeEach(() => {
    resetExtensionRegistry();
  });

  it("extracts artifacts from subtask runs", () => {
    const runs = {
      "tc1:s1": {
        messages: [],
        streamMessage: null,
        isStreaming: false,
        files: [
          { id: "f1", filename: "artifacts/out.html", content: "<p>hi</p>", createdAt: new Date(), updatedAt: new Date() },
          { id: "f2", filename: "widgets/w.html", content: "<div/>", createdAt: new Date(), updatedAt: new Date() },
        ],
      },
    };

    const items = extractItemsByKindFromSubtaskRuns("artifact", "s1", "Test", "2026-01-01T00:00:00Z", runs);
    expect(items).toHaveLength(1);
    expect(items[0].filename).toBe("artifacts/out.html");
    expect(items[0].kind).toBe("artifact");
  });

  it("extracts widgets from subtask runs", () => {
    const runs = {
      "tc1:s1": {
        messages: [],
        streamMessage: null,
        isStreaming: false,
        files: [
          { id: "f1", filename: "artifacts/out.html", content: "<p>hi</p>", createdAt: new Date(), updatedAt: new Date() },
          { id: "f2", filename: "widgets/w.html", content: "<div/>", createdAt: new Date(), updatedAt: new Date() },
        ],
      },
    };

    const items = extractItemsByKindFromSubtaskRuns("widget", "s1", "Test", "2026-01-01T00:00:00Z", runs);
    expect(items).toHaveLength(1);
    expect(items[0].filename).toBe("widgets/w.html");
  });

  it("returns empty for null runs", () => {
    expect(extractItemsByKindFromSubtaskRuns("artifact", "s1", "Test", "2026-01-01T00:00:00Z", null)).toEqual([]);
  });

  it("default truncation collapses whitespace", () => {
    const runs = {
      "tc1:s1": {
        messages: [],
        streamMessage: null,
        isStreaming: false,
        files: [
          { id: "f1", filename: "artifacts/note.md", content: "line one\n\nline two\n  spaces", createdAt: new Date(), updatedAt: new Date() },
        ],
      },
    };

    const items = extractItemsByKindFromSubtaskRuns("artifact", "s1", "Test", "2026-01-01T00:00:00Z", runs);
    expect(items[0].previewText).toBe("line one line two spaces");
  });

  it("widget truncation preserves whitespace when collapseWhitespace=false", () => {
    const content = "line one\nline two";
    const runs = {
      "tc1:s1": {
        messages: [],
        streamMessage: null,
        isStreaming: false,
        files: [
          { id: "f1", filename: "widgets/w.html", content, createdAt: new Date(), updatedAt: new Date() },
        ],
      },
    };

    const items = extractItemsByKindFromSubtaskRuns(
      "widget", "s1", "Test", "2026-01-01T00:00:00Z", runs,
      { maxLength: 220, collapseWhitespace: false }
    );
    expect(items[0].previewText).toBe("line one\nline two");
  });
});
