/**
 * NvChad Base46 主题方案迁移
 * @see https://nvchad.com
 * @see https://github.com/NvChad/base46
 *
 * base_30: UI 用色（背景、前景、灰色、强调色等）
 * base_16: Base16 标准 16 色（语法高亮等，可选）
 */

/** base_30 颜色表：背景、灰色、强调色、UI 专用 */
export interface Base30 {
  black: string;
  darker_black: string;
  black2: string;
  one_bg: string;
  one_bg2: string;
  one_bg3: string;
  grey: string;
  grey_fg: string;
  grey_fg2: string;
  light_grey: string;
  red: string;
  baby_pink: string;
  pink: string;
  green: string;
  vibrant_green: string;
  blue: string;
  nord_blue: string;
  yellow: string;
  sun: string;
  purple: string;
  dark_purple: string;
  teal: string;
  orange: string;
  cyan: string;
  line: string;
  statusline_bg: string;
  lightbg: string;
  lightbg2: string;
  pmenu_bg: string;
  folder_bg: string;
  white: string;
}

/** Base16 标准 16 色（可选，用于代码高亮等） */
export interface Base16 {
  base00: string;
  base01: string;
  base02: string;
  base03: string;
  base04: string;
  base05: string;
  base06: string;
  base07: string;
  base08: string;
  base09: string;
  base0A: string;
  base0B: string;
  base0C: string;
  base0D: string;
  base0E: string;
  base0F: string;
}

export type Base46ThemeType = "dark" | "light";

export interface Base46Theme {
  id: string;
  nameKey: string;
  type: Base46ThemeType;
  base_30: Base30;
  base_16?: Base16;
}

/** 将 base_30 映射为 MindFast 使用的 CSS 变量值（便于注入到 :root） */
export interface ThemePresetColors {
  "--app-bg": string;
  "--sidebar-bg": string;
  "--sidebar-fg": string;
  "--sidebar-muted": string;
  "--sidebar-border": string;
  "--sidebar-soft": string;
  "--sidebar-hover": string;
  "--sidebar-panel": string;
  "--sidebar-panel-strong": string;
}

/** base_30 所有键名（与 Base30 接口一致，用于遍历注入 --base30-*） */
const BASE30_KEYS: (keyof Base30)[] = [
  "black", "darker_black", "black2", "one_bg", "one_bg2", "one_bg3",
  "grey", "grey_fg", "grey_fg2", "light_grey",
  "red", "baby_pink", "pink", "green", "vibrant_green", "blue", "nord_blue",
  "yellow", "sun", "purple", "dark_purple", "teal", "orange", "cyan",
  "line", "statusline_bg", "lightbg", "lightbg2", "pmenu_bg", "folder_bg", "white",
];

function snakeToKebab(s: string): string {
  return s.replace(/_/g, "-");
}

function hexToRgba(hex: string, alpha: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * 从 base_30 生成 MindFast 的 CSS 变量值
 * 映射关系对齐 NvChad 语义：black 主背景，darker_black/black2 侧栏，white 前景，grey_fg 弱化文字，line 边框，one_bg 系列面板/悬浮
 */
export function base30ToPresetColors(b: Base30, isDark: boolean): ThemePresetColors {
  const fg = b.white;
  const overlay = isDark ? hexToRgba(fg, 0.05) : hexToRgba(b.black, 0.055);
  const soft = isDark ? hexToRgba(fg, 0.035) : hexToRgba(b.black, 0.035);
  return {
    "--app-bg": b.black,
    "--sidebar-bg": b.darker_black,
    "--sidebar-fg": b.white,
    "--sidebar-muted": b.grey_fg,
    "--sidebar-border": b.line || overlay,
    "--sidebar-soft": soft,
    "--sidebar-hover": b.one_bg,
    "--sidebar-panel": soft,
    "--sidebar-panel-strong": isDark ? hexToRgba(fg, 0.06) : "rgba(255,255,255,0.75)",
  };
}

/**
 * 与 base46 语义一一对应：注入全部 base_30 为 --base30-{key}，并包含派生变量与语义化 accent。
 * 供 ThemeScript 一次性设置到 document.documentElement.style。
 */
export function base30ToCssVars(b: Base30, isDark: boolean): Record<string, string> {
  const preset = base30ToPresetColors(b, isDark);
  const vars: Record<string, string> = { ...preset };

  BASE30_KEYS.forEach((key) => {
    vars[`--base30-${snakeToKebab(key)}`] = b[key];
  });

  // 语义化：主强调色（按钮、链接、选中态）对应 base46 teal/green
  vars["--accent"] = b.teal || b.green;
  vars["--accent-foreground"] = isDark ? b.white : b.black;
  vars["--accent-muted"] = b.vibrant_green || b.green;
  // 语义化：错误/警告等（与 base46 red/yellow 对应）
  vars["--semantic-error"] = b.red;
  vars["--semantic-warning"] = b.yellow;
  vars["--semantic-info"] = b.blue || b.nord_blue;
  vars["--semantic-success"] = b.green || b.vibrant_green;

  return vars;
}

/** 所有 base46 预设（深色 + 浅色），供设置页与 ThemeProvider 使用 */
export const BASE46_THEMES: Base46Theme[] = [
  // ----- 深色 -----
  {
    id: "chadtain",
    nameKey: "themePresetChadtain",
    type: "dark",
    base_30: {
      black: "#1e1e2e",
      darker_black: "#181825",
      black2: "#1e1e2e",
      one_bg: "#28283a",
      one_bg2: "#2f2f42",
      one_bg3: "#36364a",
      grey: "#6c7086",
      grey_fg: "#a6adc8",
      grey_fg2: "#cdd6f4",
      light_grey: "#b4befe",
      red: "#f38ba8",
      baby_pink: "#f5c2e7",
      pink: "#f5c2e7",
      green: "#a6e3a1",
      vibrant_green: "#a6e3a1",
      blue: "#89b4fa",
      nord_blue: "#89b4fa",
      yellow: "#f9e2af",
      sun: "#f9e2af",
      purple: "#cba6f7",
      dark_purple: "#cba6f7",
      teal: "#94e2d5",
      orange: "#fab387",
      cyan: "#89dceb",
      line: "#45475a",
      statusline_bg: "#1e1e2e",
      lightbg: "#2f2f42",
      lightbg2: "#36364a",
      pmenu_bg: "#28283a",
      folder_bg: "#89b4fa",
      white: "#cdd6f4",
    },
  },
  {
    id: "default-dark",
    nameKey: "themePresetDefaultDark",
    type: "dark",
    base_30: {
      black: "#404040",
      darker_black: "#3f3f46",
      black2: "#454545",
      one_bg: "#27272a",
      one_bg2: "#2d2d30",
      one_bg3: "#353538",
      grey: "#71717a",
      grey_fg: "#a1a1aa",
      grey_fg2: "#d4d4d8",
      light_grey: "#e4e4e7",
      red: "#f87171",
      baby_pink: "#fda4af",
      pink: "#f472b6",
      green: "#10b981",
      vibrant_green: "#34d399",
      blue: "#3b82f6",
      nord_blue: "#60a5fa",
      yellow: "#facc15",
      sun: "#fde047",
      purple: "#a78bfa",
      dark_purple: "#8b5cf6",
      teal: "#14b8a6",
      orange: "#fb923c",
      cyan: "#22d3ee",
      line: "rgba(255,255,255,0.05)",
      statusline_bg: "#3f3f46",
      lightbg: "#27272a",
      lightbg2: "#2d2d30",
      pmenu_bg: "#27272a",
      folder_bg: "#3b82f6",
      white: "#fafafa",
    },
  },
  {
    id: "slate",
    nameKey: "themePresetSlate",
    type: "dark",
    base_30: {
      black: "#1e293b",
      darker_black: "#0f172a",
      black2: "#334155",
      one_bg: "#1e293b",
      one_bg2: "#334155",
      one_bg3: "#475569",
      grey: "#64748b",
      grey_fg: "#94a3b8",
      grey_fg2: "#cbd5e1",
      light_grey: "#e2e8f0",
      red: "#f87171",
      baby_pink: "#fda4af",
      pink: "#f472b6",
      green: "#34d399",
      vibrant_green: "#4ade80",
      blue: "#38bdf8",
      nord_blue: "#7dd3fc",
      yellow: "#facc15",
      sun: "#fde047",
      purple: "#a78bfa",
      dark_purple: "#8b5cf6",
      teal: "#2dd4bf",
      orange: "#fb923c",
      cyan: "#22d3ee",
      line: "#334155",
      statusline_bg: "#0f172a",
      lightbg: "#1e293b",
      lightbg2: "#334155",
      pmenu_bg: "#1e293b",
      folder_bg: "#64748b",
      white: "#f1f5f9",
    },
  },
  {
    id: "emerald",
    nameKey: "themePresetEmerald",
    type: "dark",
    base_30: {
      black: "#022c22",
      darker_black: "#064e3b",
      black2: "#065f46",
      one_bg: "#064e3b",
      one_bg2: "#047857",
      one_bg3: "#059669",
      grey: "#6ee7b7",
      grey_fg: "#6ee7b7",
      grey_fg2: "#a7f3d0",
      light_grey: "#d1fae5",
      red: "#f87171",
      baby_pink: "#fda4af",
      pink: "#f472b6",
      green: "#10b981",
      vibrant_green: "#34d399",
      blue: "#0ea5e9",
      nord_blue: "#38bdf8",
      yellow: "#facc15",
      sun: "#fde047",
      purple: "#a78bfa",
      dark_purple: "#8b5cf6",
      teal: "#14b8a6",
      orange: "#fb923c",
      cyan: "#22d3ee",
      line: "rgba(255,255,255,0.08)",
      statusline_bg: "#064e3b",
      lightbg: "#047857",
      lightbg2: "#059669",
      pmenu_bg: "#064e3b",
      folder_bg: "#10b981",
      white: "#ecfdf5",
    },
  },
  {
    id: "ocean",
    nameKey: "themePresetOcean",
    type: "dark",
    base_30: {
      black: "#0c4a6e",
      darker_black: "#075985",
      black2: "#0e7490",
      one_bg: "#075985",
      one_bg2: "#0369a1",
      one_bg3: "#0284c7",
      grey: "#7dd3fc",
      grey_fg: "#7dd3fc",
      grey_fg2: "#bae6fd",
      light_grey: "#e0f2fe",
      red: "#f87171",
      baby_pink: "#fda4af",
      pink: "#f472b6",
      green: "#34d399",
      vibrant_green: "#4ade80",
      blue: "#0ea5e9",
      nord_blue: "#38bdf8",
      yellow: "#fde047",
      sun: "#fef08a",
      purple: "#a78bfa",
      dark_purple: "#8b5cf6",
      teal: "#2dd4bf",
      orange: "#fb923c",
      cyan: "#22d3ee",
      line: "rgba(255,255,255,0.1)",
      statusline_bg: "#075985",
      lightbg: "#0369a1",
      lightbg2: "#0284c7",
      pmenu_bg: "#075985",
      folder_bg: "#0ea5e9",
      white: "#f0f9ff",
    },
  },
  // ----- 浅色 -----
  {
    id: "default-light",
    nameKey: "themePresetDefaultLight",
    type: "light",
    base_30: {
      black: "#faf9f5",
      darker_black: "#eae9e4",
      black2: "#e4e3de",
      one_bg: "#dddcd6",
      one_bg2: "#d4d3cd",
      one_bg3: "#c9c8c2",
      grey: "#73726c",
      grey_fg: "#73726c",
      grey_fg2: "#575650",
      light_grey: "#3d3d38",
      red: "#dc2626",
      baby_pink: "#e11d48",
      pink: "#db2777",
      green: "#059669",
      vibrant_green: "#10b981",
      blue: "#2563eb",
      nord_blue: "#3b82f6",
      yellow: "#ca8a04",
      sun: "#eab308",
      purple: "#7c3aed",
      dark_purple: "#6d28d9",
      teal: "#0d9488",
      orange: "#ea580c",
      cyan: "#0891b2",
      line: "rgba(0,0,0,0.055)",
      statusline_bg: "#eae9e4",
      lightbg: "#f5f4f0",
      lightbg2: "#efeee9",
      pmenu_bg: "#eae9e4",
      folder_bg: "#059669",
      white: "#141413",
    },
  },
  {
    id: "cream",
    nameKey: "themePresetCream",
    type: "light",
    base_30: {
      black: "#fefce8",
      darker_black: "#fef9c3",
      black2: "#fef08a",
      one_bg: "#fef08a",
      one_bg2: "#fde047",
      one_bg3: "#facc15",
      grey: "#a16207",
      grey_fg: "#a16207",
      grey_fg2: "#854d0e",
      light_grey: "#713f12",
      red: "#dc2626",
      baby_pink: "#e11d48",
      pink: "#db2777",
      green: "#16a34a",
      vibrant_green: "#22c55e",
      blue: "#2563eb",
      nord_blue: "#3b82f6",
      yellow: "#ca8a04",
      sun: "#eab308",
      purple: "#7c3aed",
      dark_purple: "#6d28d9",
      teal: "#0d9488",
      orange: "#ea580c",
      cyan: "#0891b2",
      line: "rgba(0,0,0,0.06)",
      statusline_bg: "#fef9c3",
      lightbg: "#fef08a",
      lightbg2: "#fde047",
      pmenu_bg: "#fef9c3",
      folder_bg: "#eab308",
      white: "#422006",
    },
  },
  {
    id: "snow",
    nameKey: "themePresetSnow",
    type: "light",
    base_30: {
      black: "#f8fafc",
      darker_black: "#f1f5f9",
      black2: "#e2e8f0",
      one_bg: "#e2e8f0",
      one_bg2: "#cbd5e1",
      one_bg3: "#94a3b8",
      grey: "#64748b",
      grey_fg: "#64748b",
      grey_fg2: "#475569",
      light_grey: "#334155",
      red: "#dc2626",
      baby_pink: "#e11d48",
      pink: "#db2777",
      green: "#16a34a",
      vibrant_green: "#22c55e",
      blue: "#3b82f6",
      nord_blue: "#60a5fa",
      yellow: "#ca8a04",
      sun: "#eab308",
      purple: "#7c3aed",
      dark_purple: "#6d28d9",
      teal: "#0d9488",
      orange: "#ea580c",
      cyan: "#0891b2",
      line: "#e2e8f0",
      statusline_bg: "#f1f5f9",
      lightbg: "#f8fafc",
      lightbg2: "#f1f5f9",
      pmenu_bg: "#f1f5f9",
      folder_bg: "#3b82f6",
      white: "#0f172a",
    },
  },
];

export function getBase46ThemeById(id: string): Base46Theme | undefined {
  return BASE46_THEMES.find((t) => t.id === id);
}

export function getBase46ThemesByType(type: Base46ThemeType): Base46Theme[] {
  return BASE46_THEMES.filter((t) => t.type === type);
}
