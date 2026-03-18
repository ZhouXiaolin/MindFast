import { useTranslation } from "react-i18next";
import { cn } from "../utils/cn";
import { useAppStore } from "../stores/app";
import {
  type Base46Theme,
  getBase46ThemesByType,
} from "../themes/base46";

function PresetCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: Base46Theme;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const { t } = useTranslation();
  const b = theme.base_30;
  const swatches = [
    b.black,
    b.darker_black,
    b.white,
    b.grey_fg,
    b.teal || b.green,
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-xl border-2 text-left transition-colors overflow-hidden",
        "hover:border-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        isSelected ? "border-accent bg-sidebar-panel" : "border-sidebar-soft bg-sidebar-panel/50"
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
        <span className="text-sm font-medium text-sidebar">{t(theme.nameKey)}</span>
      </div>
    </button>
  );
}

export function SettingsThemePresets() {
  const { t } = useTranslation();
  const themePresetIdDark = useAppStore((s) => s.themePresetIdDark);
  const themePresetIdLight = useAppStore((s) => s.themePresetIdLight);
  const setThemePresetIdDark = useAppStore((s) => s.setThemePresetIdDark);
  const setThemePresetIdLight = useAppStore((s) => s.setThemePresetIdLight);

  const darkPresets = getBase46ThemesByType("dark");
  const lightPresets = getBase46ThemesByType("light");

  return (
    <div className="flex flex-col gap-10">
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-sidebar">
            {t("themePresetDarkTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {darkPresets.map((theme) => (
              <PresetCard
                key={theme.id}
                theme={theme}
                isSelected={themePresetIdDark === theme.id}
                onSelect={() => setThemePresetIdDark(theme.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-sidebar">
            {t("themePresetLightTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {lightPresets.map((theme) => (
              <PresetCard
                key={theme.id}
                theme={theme}
                isSelected={themePresetIdLight === theme.id}
                onSelect={() => setThemePresetIdLight(theme.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
