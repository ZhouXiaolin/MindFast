import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { initApp } from "./init";
import { useAppStore } from "./stores/app";
import { router } from "./routes";

function AppInner() {
  const { i18n } = useTranslation();
  const lang = useAppStore((s) => s.lang);
  const hydrated = useAppStore((s) => s.hydrated);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void initApp().catch((error) => {
      console.error("Failed to initialize app runtime:", error);
      if (!cancelled) {
        setInitError("Failed to initialize app.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void i18n.changeLanguage(lang);
  }, [hydrated, i18n, lang]);

  if (initError) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-semantic-error">
        {initError}
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sidebar-muted">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-sidebar-muted border-t-accent" />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return <AppInner />;
}
