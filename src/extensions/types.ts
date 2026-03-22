// Extension API type definitions

// ── Host Surfaces ──

export type HostSurface =
  | "stream.inline"
  | "stream.attachment"
  | "rail.left"
  | "sidebar.right"
  | "detail.page"
  | "list.card"
  | "hidden";

export type SurfaceConflictMode = "stack" | "replace" | "tabs";

export interface HostSurfaceDefaults {
  surface: HostSurface;
  defaultConflictMode: SurfaceConflictMode;
}

// ── Workspace Kind ──

export interface WorkspaceMatcher {
  prefixes?: string[];
  extensions?: string[];
  fileNames?: string[];
}

export type WorkspaceModel = "document" | "taskflow";

export interface SurfacePolicy {
  activation: "auto" | "manual" | "on-demand";
  autoOpenOnWrite?: boolean;
  autoOpenOnNewItem?: boolean;
  autoCloseWhenComplete?: boolean;
  dismissOnNextUserTurnWhenComplete?: boolean;
  replaceExisting?: boolean;
  maxVisibleItems?: number;
}

export interface WorkspaceKindContribution {
  kind: string;
  displayName: string;
  model: WorkspaceModel;
  sourceType: "workspace-file" | "runtime-store";
  match?: WorkspaceMatcher;
  presentation: {
    primarySurface: HostSurface;
    secondarySurfaces?: HostSurface[];
    openPolicy?: SurfacePolicy;
    conflictMode?: SurfaceConflictMode;
    surfacePriority?: number;
  };
}

// ── Guidelines & Prompts ──

export interface GuidelineContribution {
  path: string;
  content: string;
  readonly?: boolean;
  owner?: string;
  order?: number;
}

export interface PromptFragmentContribution {
  id: string;
  content: string;
  order?: number;
}

// ── Projection ──

export interface ProjectionContext {
  sessionId: string;
  extensionId: string;
}

export type ProjectionInput =
  | { type: "workspace-file"; file: import("../ai/workspace/types").WorkspaceFile }
  | { type: "runtime-state"; stateKind: string; state: unknown };

export interface SurfaceItemBase {
  id: string;
  kind: string;
  surface: HostSurface;
  title?: string;
  subtitle?: string;
}

export interface DocumentSurfaceItem extends SurfaceItemBase {
  model: "document";
  filename: string;
  content: string;
  previewText?: string;
  fileType?: string;
  summaryKind?: string;
}

export interface TaskStep {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface TaskFlowSurfaceItem extends SurfaceItemBase {
  model: "taskflow";
  flowType: "plan" | "subagent-plan";
  source: "workspace-file" | "runtime-store";
  steps: TaskStep[];
  status: "pending" | "running" | "completed" | "failed";
}

export type SurfaceItem = DocumentSurfaceItem | TaskFlowSurfaceItem;

export interface ProjectionContribution {
  kind: string;
  surface: HostSurface;
  project: (input: ProjectionInput, ctx: ProjectionContext) => SurfaceItem | null;
}

// ── File Renderers ──

export interface FileRendererProps {
  item: SurfaceItem;
}

export interface FileRendererContribution {
  kind: string;
  surface: HostSurface;
  match?: {
    fileType?: string;
    summaryKind?: string;
    extensions?: string[];
  };
  component: React.ComponentType<FileRendererProps>;
  priority?: number;
}

// ── Tool Renderers ──

export interface ToolRendererContribution {
  toolName: string;
  renderer: import("../ui/chat/tools/types").ToolRenderer;
}

// ── Tool Contributions ──

export type ExtensionPermission =
  | "workspace.read"
  | "workspace.write"
  | "subagent.spawn"
  | "shell.simulated"
  | "shell.native"
  | "network"
  | "mcp";

export interface ToolContribution {
  tool: import("@mariozechner/pi-agent-core").AgentTool;
  permissions?: ExtensionPermission[];
}

// ── Extension Manifest ──

export interface ExtensionContributions {
  guidelines?: GuidelineContribution[];
  workspaceKinds?: WorkspaceKindContribution[];
  projections?: ProjectionContribution[];
  fileRenderers?: FileRendererContribution[];
  toolRenderers?: ToolRendererContribution[];
  promptFragments?: PromptFragmentContribution[];
  tools?: ToolContribution[];
}

export interface MindFastExtension {
  id: string;
  name: string;
  version: string;
  enabledByDefault?: boolean;
  description?: string;
  contributes?: ExtensionContributions;
}
