import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";

export type ThemePresetColors = {
  appBg: string;
  sidebarBg: string;
  sidebarFg: string;
  sidebarMuted: string;
  accent?: string;
};

export type ThemePreset = {
  id: string;
  nameKey: string;
  colors: ThemePresetColors;
};

/** Mock: 深色主题配色方案 */
const MOCK_DARK_PRESETS: ThemePreset[] = [
  {
    id: "default-dark",
    nameKey: "themePresetDefaultDark",
    colors: {
      appBg: "#404040",
      sidebarBg: "#3f3f46",
      sidebarFg: "#fafafa",
      sidebarMuted: "#a1a1aa",
      accent: "#10b981",
    },
  },
  {
    id: "slate",
    nameKey: "themePresetSlate",
    colors: {
      appBg: "#1e293b",
      sidebarBg: "#0f172a",
      sidebarFg: "#f1f5f9",
      sidebarMuted: "#94a3b8",
      accent: "#64748b",
    },
  },
  {
    id: "emerald",
    nameKey: "themePresetEmerald",
    colors: {
      appBg: "#022c22",
      sidebarBg: "#064e3b",
      sidebarFg: "#ecfdf5",
      sidebarMuted: "#6ee7b7",
      accent: "#10b981",
    },
  },
  {
    id: "ocean",
    nameKey: "themePresetOcean",
    colors: {
      appBg: "#0c4a6e",
      sidebarBg: "#075985",
      sidebarFg: "#f0f9ff",
      sidebarMuted: "#7dd3fc",
      accent: "#0ea5e9",
    },
  },
];

/** Mock: 浅色主题配色方案 */
const MOCK_LIGHT_PRESETS: ThemePreset[] = [
  {
    id: "default-light",
    nameKey: "themePresetDefaultLight",
    colors: {
      appBg: "#faf9f5",
      sidebarBg: "#eae9e4",
      sidebarFg: "#141413",
      sidebarMuted: "#73726c",
      accent: "#059669",
    },
  },
  {
    id: "cream",
    nameKey: "themePresetCream",
    colors: {
      appBg: "#fefce8",
      sidebarBg: "#fef9c3",
      sidebarFg: "#422006",
      sidebarMuted: "#a16207",
      accent: "#eab308",
    },
  },
  {
    id: "snow",
    nameKey: "themePresetSnow",
    colors: {
      appBg: "#f8fafc",
      sidebarBg: "#f1f5f9",
      sidebarFg: "#0f172a",
      sidebarMuted: "#64748b",
      accent: "#3b82f6",
    },
  },
];

function PresetCard({
  preset,
  isSelected,
  onSelect,
}: {
  preset: ThemePreset;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = preset;
  const swatches = [
    colors.appBg,
    colors.sidebarBg,
    colors.sidebarFg,
    colors.sidebarMuted,
    colors.accent ?? colors.sidebarFg,
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-xl border-2 text-left transition-colors overflow-hidden",
        "hover:border-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        isSelected ? "border-emerald-500 bg-sidebar-panel" : "border-sidebar-soft bg-sidebar-panel/50"
      )}
    >
      <div className="flex h-12 w-full shrink-0 gap-0.5 p-1.5">
        {swatches.map((hex, i) => (
          <div
            key={i}
            className="flex-1 rounded-md border border-white/10"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
      <div className="px-3 py-2">
        <span className="text-sm font-medium text-sidebar">{t(preset.nameKey)}</span>
      </div>
    </button>
  );
}

export function SettingsThemePresets() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-10">
      {/* 两块：深色主题 | 浅色主题 */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* 块一：深色主题配色方案 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-sidebar">
            {t("themePresetDarkTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {MOCK_DARK_PRESETS.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onSelect={() => {}}
              />
            ))}
          </div>
        </div>

        {/* 块二：浅色主题配色方案 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-sidebar">
            {t("themePresetLightTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {MOCK_LIGHT_PRESETS.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onSelect={() => {}}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
