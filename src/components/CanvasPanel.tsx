import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";

export function CanvasPanel() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ckReady, setCkReady] = useState(false);

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
    const dpr = window.devicePixelRatio ?? 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#27272a";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "14px system-ui";
    ctx.fillText("Canvas area – CanvasKit: " + (ckReady ? "ready" : "loading…"), 16, 24);
  }, [ckReady]);

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900 p-4")}>
      <h3 className="mb-2 text-sm font-medium text-zinc-300">{t("canvas")}</h3>
      <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg bg-zinc-800">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        canvaskit-wasm: {ckReady ? "loaded" : "loading…"}
      </p>
    </div>
  );
}
