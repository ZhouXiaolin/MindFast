import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/app";
import { cn } from "../../utils/cn";
import type { ColorMode, ChatFont } from "../../stores/app";

const sectionBorder = "border-b border-sidebar pb-8 mb-8 last:mb-0 last:border-b-0 last:pb-0";
const heading2Class = "text-xs font-normal mb-4 text-sidebar-muted";
const mutedClass = "text-sm";

export function SettingsGeneral() {
  const { t } = useTranslation();
  const { colorMode, setColorMode, chatFont, setChatFont } = useAppStore();

  const colorModes: { value: ColorMode; labelKey: string }[] = [
    { value: "light", labelKey: "colorModeLight" },
    { value: "auto", labelKey: "colorModeAuto" },
    { value: "dark", labelKey: "colorModeDark" },
  ];
  const chatFonts: { value: ChatFont; labelKey: string }[] = [
    { value: "default", labelKey: "chatFontDefault" },
    { value: "sans", labelKey: "chatFontSans" },
    { value: "system", labelKey: "chatFontSystem" },
    { value: "dyslexic", labelKey: "chatFontDyslexic" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Appearance */}
      <section className={sectionBorder}>
        <h2 className={heading2Class}>
          {t("settingsAppearance")}
        </h2>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className={mutedClass + " mb-3 text-sidebar-muted"}>
              {t("settingsColorMode")}
            </h3>
            <div className="flex gap-2">
              {colorModes.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColorMode(value)}
                  className={cn(
                    "rounded-lg border border-sidebar px-4 py-2 text-sm cursor-pointer transition-all duration-200",
                    colorMode === value
                      ? "bg-sidebar-hover text-sidebar"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className={mutedClass + " mb-3 text-sidebar-muted"}>
              {t("settingsChatFont")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {chatFonts.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChatFont(value)}
                  className={cn(
                    "rounded-lg border border-sidebar px-4 py-2 text-sm cursor-pointer transition-all duration-200",
                    chatFont === value
                      ? "bg-sidebar-hover text-sidebar"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
