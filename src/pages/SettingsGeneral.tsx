import { useTranslation } from "react-i18next";
import { useAppStore } from "../stores/appStore";
import { cn } from "../lib/cn";
import { useState } from "react";
import type { ColorMode } from "../stores/appStore";

const sectionBorder = "border-b border-sidebar pb-8 mb-8 last:mb-0 last:border-b-0 last:pb-0";
const heading2Class = "text-xs font-normal mb-4 text-sidebar-muted";
const mutedClass = "text-sm";
const labelClass = "block text-sm font-medium mb-1.5 text-sidebar";
const inputClass =
  "w-full max-w-md rounded-lg border border-sidebar bg-transparent px-3 py-2 text-sidebar placeholder-sidebar-muted focus:outline-none focus:ring-1 focus:ring-[var(--sidebar-border)]";

export function SettingsGeneral() {
  const { t } = useTranslation();
  const { userName, setUserName, colorMode, setColorMode } = useAppStore();
  const [displayName, setDisplayName] = useState(userName);
  const [claudeName, setClaudeName] = useState("Solaren");
  const [workDesc, setWorkDesc] = useState("Engineering");
  const [preferences, setPreferences] = useState("");
  const [responseCompletions, setResponseCompletions] = useState(false);
  const [chatFont, setChatFont] = useState("default");
  const [voice, setVoice] = useState("Buttery");

  const colorModes: { value: ColorMode; labelKey: string }[] = [
    { value: "light", labelKey: "colorModeLight" },
    { value: "auto", labelKey: "colorModeAuto" },
    { value: "dark", labelKey: "colorModeDark" },
  ];
  const chatFonts = [
    { value: "default", labelKey: "chatFontDefault" },
    { value: "sans", labelKey: "chatFontSans" },
    { value: "system", labelKey: "chatFontSystem" },
    { value: "dyslexic", labelKey: "chatFontDyslexic" },
  ];
  const voices = ["Buttery", "Airy", "Mellow", "Glassy", "Rounded"];

  return (
    <div className="flex flex-col gap-6">
      {/* Profile */}
      <section className={sectionBorder}>
        <h2 className={heading2Class}>
          {t("settingsProfile")}
        </h2>
        <div className="flex flex-col gap-6">
          <div>
            <label className={labelClass}>
              {t("settingsFullName")}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-sidebar px-3 py-1 text-sm hover:bg-sidebar-hover"
              >
                {t("settingsRandomizeAvatar")}
              </button>
              <input
                type="text"
                className={inputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => setUserName(displayName)}
                aria-required
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>
              {t("settingsWhatShouldClaudeCallYou")}
            </label>
            <input
              type="text"
              className={inputClass}
              value={claudeName}
              onChange={(e) => setClaudeName(e.target.value)}
              aria-required
            />
          </div>
          <div>
            <label className={labelClass}>
              {t("settingsWhatDescribesYourWork")}
            </label>
            <select
              className={inputClass}
              value={workDesc}
              onChange={(e) => setWorkDesc(e.target.value)}
              aria-expanded={false}
            >
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Research">Research</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>
              {t("settingsPersonalPreferences")}
            </label>
            <p className={mutedClass + " mb-2 text-sidebar-muted"}>
              {t("settingsPersonalPreferencesHint")}
            </p>
            <textarea
              className={cn(inputClass, "min-h-[100px] resize-y")}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder={t("settingsPersonalPreferencesPlaceholder")}
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className={sectionBorder}>
        <h2 className={heading2Class}>
          {t("settingsNotifications")}
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-sidebar">
                {t("settingsResponseCompletions")}
              </p>
              <p className={mutedClass + " mt-0.5 text-sidebar-muted"}>
                {t("settingsResponseCompletionsHint")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={responseCompletions}
              onClick={() => setResponseCompletions((v) => !v)}
              className={cn(
                "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                responseCompletions ? "bg-emerald-600" : "bg-white/15"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white transition-[left]",
                  responseCompletions ? "left-5" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </section>

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
                    "rounded-lg border border-sidebar px-4 py-2 text-sm transition-colors",
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
                    "rounded-lg border border-sidebar px-4 py-2 text-sm transition-colors",
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

      {/* Voice */}
      <section className={sectionBorder}>
        <h2 className={heading2Class}>
          {t("settingsVoice")}
        </h2>
        <div>
          <p className={labelClass}>
            {t("settingsVoiceLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {voices.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVoice(v)}
                className={cn(
                  "rounded-lg border border-sidebar px-4 py-2 text-sm transition-colors",
                  voice === v
                    ? "bg-sidebar-hover text-sidebar"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
