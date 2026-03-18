import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { useAppStore } from "./stores/app";
import { router } from "./routes";

function AppInner() {
  const { i18n } = useTranslation();
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [i18n, lang]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return <AppInner />;
}
