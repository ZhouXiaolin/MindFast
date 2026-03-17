import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, Server, Palette } from "lucide-react";
import { cn } from "../lib/cn";

const SETTINGS_LINKS = [
  { path: "general", labelKey: "settingsGeneral", icon: SlidersHorizontal },
  { path: "theme-presets", labelKey: "settingsThemePresets", icon: Palette },
  { path: "provider", labelKey: "settingsProvider", icon: Server },
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
          {SETTINGS_LINKS.map(({ path, labelKey, icon: Icon }) => (
            <NavLink
              key={path}
              to={`/settings/${path}`}
              end={path === "general" || path === "theme-presets"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-panel-strong font-medium"
                    : "hover:bg-sidebar-panel"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
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
