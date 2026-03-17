import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";
import { useAppStore } from "../stores/appStore";

function getThemeColors(): { hover: string; muted: string } {
  if (typeof document === "undefined")
    return { hover: "transparent", muted: "transparent" };
  const root = document.documentElement;
  const style = getComputedStyle(root);
  return {
    hover: style.getPropertyValue("--sidebar-hover").trim() || style.getPropertyValue("--base30-one-bg").trim() || "transparent",
    muted: style.getPropertyValue("--sidebar-muted").trim() || style.getPropertyValue("--base30-grey-fg").trim() || "transparent",
  };
}

export function CanvasPanel() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ckReady, setCkReady] = useState(false);
  const themePresetIdDark = useAppStore((s) => s.themePresetIdDark);
  const themePresetIdLight = useAppStore((s) => s.themePresetIdLight);
  const colorMode = useAppStore((s) => s.colorMode);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import("canvaskit-wasm"),
      import("canvaskit-wasm/bin/canvaskit.wasm?url").then((m) => m.default),
    ])
      .then(([mod, wasmUrl]) => {
        const init = (mod as { default?: (opts: { locateFile: (f: string) => string }) => Promise<unknown> }).default;
        if (typeof init !== "function" || cancelled) return;
        return init({ locateFile: () => wasmUrl });
      })
      .then(() => {
        if (!cancelled) setCkReady(true);
      })
      .catch(() => {
        if (!cancelled) setCkReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { hover, muted } = getThemeColors();
    const dpr = window.devicePixelRatio ?? 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = hover;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = muted;
    ctx.font = "14px system-ui";
    ctx.fillText("Canvas area – CanvasKit: " + (ckReady ? "ready" : "loading…"), 16, 24);
  }, [ckReady, themePresetIdDark, themePresetIdLight, colorMode]);

  return (
    <div className={cn("rounded-xl border border-sidebar bg-sidebar-hover p-4")}>
      <h3 className="mb-2 text-sm font-medium text-sidebar">{t("canvas")}</h3>
      <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg bg-sidebar">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <p className="mt-2 text-xs text-sidebar-muted">
        canvaskit-wasm: {ckReady ? "loaded" : "loading…"}
      </p>
    </div>
  );
}
