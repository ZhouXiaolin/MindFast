import { describe, it, expect, beforeEach } from "vitest";
import { getExtensionRegistry, resetExtensionRegistry, resolveWorkspaceKind } from "../registry";

describe("resolveWorkspaceKind", () => {
  beforeEach(() => {
    resetExtensionRegistry();
  });

  it("resolves artifact paths", () => {
    expect(resolveWorkspaceKind("artifacts/foo.html")).toBe("artifact");
    expect(resolveWorkspaceKind("artifacts")).toBe("artifact");
  });

  it("resolves widget paths", () => {
    expect(resolveWorkspaceKind("widgets/bar.html")).toBe("widget");
    expect(resolveWorkspaceKind("widgets")).toBe("widget");
  });

  it("resolves plan paths (only .jsonl)", () => {
    expect(resolveWorkspaceKind("plans/step.jsonl")).toBe("plan");
    expect(resolveWorkspaceKind("plans")).toBe("plan");
    expect(resolveWorkspaceKind("plans/readme.md")).toBeNull();
  });

  it("returns null for unknown paths", () => {
    expect(resolveWorkspaceKind("docs/readme.md")).toBeNull();
    expect(resolveWorkspaceKind("src/main.ts")).toBeNull();
  });

  it("handles path normalization", () => {
    expect(resolveWorkspaceKind("./artifacts/foo.html")).toBe("artifact");
    expect(resolveWorkspaceKind("artifacts//foo.html")).toBe("artifact");
    expect(resolveWorkspaceKind("/widgets/bar.html")).toBe("widget");
  });
});

describe("getExtensionRegistry (lazy init)", () => {
  beforeEach(() => {
    resetExtensionRegistry();
  });

  it("auto-registers builtins on first access", () => {
    const registry = getExtensionRegistry();
    expect(registry.getKind("artifact")).toBeDefined();
    expect(registry.getKind("widget")).toBeDefined();
    expect(registry.getKind("plan")).toBeDefined();
    expect(registry.getKind("subagent-plan")).toBeDefined();
  });

  it("returns default directories from builtins", () => {
    const dirs = getExtensionRegistry().getDefaultDirectories();
    expect(dirs).toContain("artifacts");
    expect(dirs).toContain("widgets");
    expect(dirs).toContain("plans");
  });
});
