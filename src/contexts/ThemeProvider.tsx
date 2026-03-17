import { useEffect, useState, type ReactNode } from "react";
import { useAppStore } from "../stores/appStore";

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

// Separate component that subscribes to store and sets data-theme
function ThemeScript() {
  const resolved = useResolvedTheme();
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);
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
