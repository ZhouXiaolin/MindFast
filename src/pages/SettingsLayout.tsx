import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";

const SETTINGS_LINKS = [
  { path: "general", labelKey: "settingsGeneral" },
  { path: "account", labelKey: "settingsAccount" },
  { path: "privacy", labelKey: "settingsPrivacy" },
  { path: "billing", labelKey: "settingsBilling" },
  { path: "capabilities", labelKey: "settingsCapabilities" },
  { path: "connectors", labelKey: "settingsConnectors" },
  { path: "claude-code", labelKey: "settingsClaudeCode" },
] as const;

export function SettingsLayout() {
  const { t } = useTranslation();

  return (
    <div className="settings-page flex min-h-full flex-col">
      <header className="shrink-0 border-b border-sidebar px-6 py-4">
        <h1 className="text-2xl font-medium text-sidebar">
          {t("settings")}
        </h1>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav
          className="flex w-52 shrink-0 flex-col gap-0.5 border-r border-sidebar px-4 py-6"
          aria-label={t("settings")}
        >
          {SETTINGS_LINKS.map(({ path, labelKey }) => (
            <NavLink
              key={path}
              to={`/settings/${path}`}
              end={path === "general"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-white/10 font-medium"
                    : "hover:bg-white/5"
                )
              }
            >
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 flex-1 overflow-auto px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
