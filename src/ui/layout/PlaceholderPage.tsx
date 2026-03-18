import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const pathToLabel: Record<string, string> = {
  search: "search",
  customize: "customize",
  chats: "chats",
  projects: "projects",
  artifacts: "artifacts",
  code: "code",
};

export function PlaceholderPage() {
  const { t } = useTranslation();
  const path = useLocation().pathname.slice(1) || "home";
  const labelKey = pathToLabel[path] ?? "welcome";

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-app">{t("welcome")} — {t(labelKey)}</p>
    </div>
  );
}
