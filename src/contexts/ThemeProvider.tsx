import { useEffect, useState, type ReactNode } from "react";
import { useAppStore } from "../stores/appStore";
import {
  getBase46ThemeById,
  base30ToCssVars,
} from "../themes/base46";

export type ResolvedTheme = "light" | "dark";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useResolvedTheme(): ResolvedTheme {
  const colorMode = useAppStore((s) => s.colorMode);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  useEffect(() => {
    if (colorMode !== "auto") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => setSystemTheme(media.matches ? "light" : "dark");
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [colorMode]);

  if (colorMode === "light") return "light";
  if (colorMode === "dark") return "dark";
  return systemTheme;
}

// Separate component that subscribes to store and sets data-theme + Base46 CSS vars
function ThemeScript() {
  const resolved = useResolvedTheme();
  const themePresetIdDark = useAppStore((s) => s.themePresetIdDark);
  const themePresetIdLight = useAppStore((s) => s.themePresetIdLight);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    const presetId = resolved === "dark" ? themePresetIdDark : themePresetIdLight;
    const theme = getBase46ThemeById(presetId);
    if (theme) {
      const vars = base30ToCssVars(theme.base_30, theme.type === "dark");
      const root = document.documentElement;
      Object.entries(vars).forEach(([key, value]) =>
        root.style.setProperty(key, value)
      );
    }
  }, [resolved, themePresetIdDark, themePresetIdLight]);

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeScript />
      {children}
    </>
  );
}
