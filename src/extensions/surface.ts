import type { HostSurface, HostSurfaceDefaults, SurfaceConflictMode } from "./types";

const SURFACE_DEFAULTS: HostSurfaceDefaults[] = [
  { surface: "stream.inline", defaultConflictMode: "stack" },
  { surface: "stream.attachment", defaultConflictMode: "stack" },
  { surface: "rail.left", defaultConflictMode: "replace" },
  { surface: "sidebar.right", defaultConflictMode: "replace" },
  { surface: "detail.page", defaultConflictMode: "replace" },
  { surface: "list.card", defaultConflictMode: "stack" },
  { surface: "hidden", defaultConflictMode: "stack" },
];

const defaultsByKey = new Map(SURFACE_DEFAULTS.map((d) => [d.surface, d]));

export function getSurfaceConflictMode(surface: HostSurface, override?: SurfaceConflictMode): SurfaceConflictMode {
  return override ?? defaultsByKey.get(surface)?.defaultConflictMode ?? "stack";
}
