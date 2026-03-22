import { normalizeWorkspacePath } from "../ai/path-utils";
import type {
  FileRendererContribution,
  HostSurface,
  MindFastExtension,
  ToolRendererContribution,
  WorkspaceKindContribution,
} from "./types";

class ExtensionRegistry {
  private _extensions = new Map<string, MindFastExtension>();
  private _kinds = new Map<string, WorkspaceKindContribution>();
  private _fileRenderers: FileRendererContribution[] = [];
  private _toolRenderers = new Map<string, ToolRendererContribution>();

  register(extension: MindFastExtension): void {
    this._extensions.set(extension.id, extension);

    const contributes = extension.contributes;
    if (!contributes) return;

    for (const kind of contributes.workspaceKinds ?? []) {
      this._kinds.set(kind.kind, kind);
    }

    for (const renderer of contributes.fileRenderers ?? []) {
      this._fileRenderers.push(renderer);
    }

    for (const renderer of contributes.toolRenderers ?? []) {
      this._toolRenderers.set(renderer.toolName, renderer);
    }
  }

  getExtension(id: string): MindFastExtension | undefined {
    return this._extensions.get(id);
  }

  getKind(kind: string): WorkspaceKindContribution | undefined {
    return this._kinds.get(kind);
  }

  getAllKinds(): WorkspaceKindContribution[] {
    return Array.from(this._kinds.values());
  }

  resolveWorkspaceKind(inputPath: string): string | null {
    const path = normalizeWorkspacePath(inputPath);

    for (const kind of this._kinds.values()) {
      if (kind.sourceType !== "workspace-file" || !kind.match) continue;

      if (kind.match.prefixes) {
        for (const prefix of kind.match.prefixes) {
          const trimmedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
          if (path === trimmedPrefix || path.startsWith(`${trimmedPrefix}/`)) {
            if (kind.match.extensions && path !== trimmedPrefix) {
              const ext = path.split(".").pop()?.toLowerCase();
              if (!ext || !kind.match.extensions.includes(ext)) continue;
            }
            return kind.kind;
          }
        }
      }

      if (kind.match.fileNames) {
        const filename = path.split("/").pop() ?? "";
        if (kind.match.fileNames.includes(filename)) {
          return kind.kind;
        }
      }
    }

    return null;
  }

  getDefaultDirectories(): string[] {
    const dirs: string[] = [];
    for (const kind of this._kinds.values()) {
      if (kind.sourceType !== "workspace-file" || !kind.match?.prefixes) continue;
      for (const prefix of kind.match.prefixes) {
        const trimmed = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
        if (trimmed) dirs.push(trimmed);
      }
    }
    return dirs;
  }

  getFileRenderer(kind: string, surface: HostSurface, fileType?: string): FileRendererContribution | undefined {
    let best: FileRendererContribution | undefined;
    let bestPriority = -Infinity;

    for (const r of this._fileRenderers) {
      if (r.kind !== kind || r.surface !== surface) continue;
      if (r.match?.fileType && r.match.fileType !== fileType) continue;

      const priority = r.priority ?? 0;
      if (priority > bestPriority) {
        best = r;
        bestPriority = priority;
      }
    }

    if (!best) {
      for (const r of this._fileRenderers) {
        if (r.kind !== kind || r.surface !== surface) continue;
        if (r.match?.fileType) continue;
        const priority = r.priority ?? 0;
        if (priority > bestPriority) {
          best = r;
          bestPriority = priority;
        }
      }
    }

    return best;
  }

  getToolRenderer(toolName: string): ToolRendererContribution | undefined {
    return this._toolRenderers.get(toolName);
  }

  getKindsForSurface(surface: HostSurface): WorkspaceKindContribution[] {
    return this.getAllKinds()
      .filter((k) => k.presentation.primarySurface === surface)
      .sort((a, b) => (b.presentation.surfacePriority ?? 0) - (a.presentation.surfacePriority ?? 0));
  }
}

import { builtinExtensions } from "./builtin";

let _registry: ExtensionRegistry | null = null;

export function getExtensionRegistry(): ExtensionRegistry {
  if (!_registry) {
    _registry = new ExtensionRegistry();
    for (const ext of builtinExtensions) {
      _registry.register(ext);
    }
  }
  return _registry;
}

export function resetExtensionRegistry(): void {
  _registry = null;
}

export function resolveWorkspaceKind(inputPath: string): string | null {
  return getExtensionRegistry().resolveWorkspaceKind(inputPath);
}
