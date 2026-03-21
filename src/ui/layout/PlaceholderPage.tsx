import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";

const pathToLabel: Record<string, string> = {
  search: "search",
  customize: "customize",
  chats: "chats",
  projects: "projects",
  artifacts: "artifacts",
  code: "code",
  widgets: "widgets",
};

export function PlaceholderPage() {
  const { t } = useTranslation();
  const path = useLocation().pathname.slice(1) || "home";
  const labelKey = pathToLabel[path] ?? "welcome";

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <FolderOpen className="mx-auto mb-3 h-8 w-8 text-sidebar-muted" />
        <p className="text-lg font-medium text-sidebar">{t(labelKey)}</p>
        <p className="mt-1 text-sm text-sidebar-muted">{t("welcome")}</p>
      </div>
    </div>
  );
}
