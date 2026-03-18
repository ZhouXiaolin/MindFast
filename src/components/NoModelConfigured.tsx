import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings, ArrowRight } from "lucide-react";
import { cn } from "../utils/cn";

export function NoModelConfigured() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sidebar-hover">
          <Settings className="h-10 w-10 text-sidebar-muted" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-sidebar">
          {t("noModelConfigured")}
        </h2>
        <p className="mb-8 text-sm text-sidebar-muted">
          {t("noModelConfiguredDesc")}
        </p>
        <button
          type="button"
          onClick={() => navigate("/settings/provider")}
          className={cn(
            "flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-accent-foreground",
            "text-sm font-medium hover:opacity-90 transition-opacity"
          )}
        >
          <span>{t("goToProviderSettings")}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
