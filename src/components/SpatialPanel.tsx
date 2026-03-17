import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRbush } from "../hooks/useRbush";
import { useRbushDemoStore } from "../stores/rbushDemoStore";
import { cn } from "../lib/cn";

export function SpatialPanel() {
  const { t } = useTranslation();
  const { items } = useRbushDemoStore();
  const normalized = useMemo(
    () =>
      items.map(({ id, minX, minY, maxX, maxY }) => ({
        id,
        minX,
        minY,
        maxX,
        maxY,
      })),
    [items]
  );
  const { search } = useRbush(normalized);
  const query = { minX: 40, minY: 20, maxX: 160, maxY: 100 };
  const found = useMemo(() => search(query.minX, query.minY, query.maxX, query.maxY), [search]);

  return (
    <div className={cn("rounded-xl border border-sidebar bg-sidebar-hover p-4")}>
      <h3 className="mb-2 text-sm font-medium text-sidebar">{t("spatial")}</h3>
      <p className="mb-2 text-xs text-sidebar-muted">
        RBush 示例：当前 {items.length} 个矩形，查询区域 [{query.minX},{query.minY}]–[{query.maxX},{query.maxY}]
      </p>
      <ul className="space-y-1 text-sm text-app">
        {items.map((item) => (
          <li key={item.id} className="flex gap-2">
            <span className="text-sidebar-muted">{item.id}:</span>
            <span>
              [{item.minX},{item.minY}]–[{item.maxX},{item.maxY}]
            </span>
            {found.some((f) => (f as { id?: string }).id === item.id) && (
              <span className="text-emerald-400">✓ in query</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
