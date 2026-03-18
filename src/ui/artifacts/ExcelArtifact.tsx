import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import type { ArtifactRendererProps } from "./types";
import { base64ToArrayBuffer, decodeBase64, downloadBlob } from "./base64-utils";

export function ExcelArtifact({ filename, content }: ArtifactRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const getMimeType = () => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext === "xls"
      ? "application/vnd.ms-excel"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  };

  useEffect(() => {
    if (!content || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const XLSX = await import("xlsx");
        const arrayBuffer = base64ToArrayBuffer(content);
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        if (cancelled) return;
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.className = "overflow-auto h-full flex flex-col";
        container.appendChild(wrapper);

        if (workbook.SheetNames.length > 1) {
          const tabContainer = document.createElement("div");
          tabContainer.className =
            "flex gap-2 border-b border-sidebar-soft sticky top-0 bg-sidebar-panel z-10 px-2";
          const sheetContents: HTMLElement[] = [];

          workbook.SheetNames.forEach((sheetName, index) => {
            const tab = document.createElement("button");
            tab.textContent = sheetName;
            tab.className =
              index === 0
                ? "px-3 py-2 text-xs font-medium border-b-2 border-accent text-sidebar"
                : "px-3 py-2 text-xs font-medium text-sidebar-muted hover:text-sidebar";

            const sheetDiv = document.createElement("div");
            sheetDiv.style.display = index === 0 ? "flex" : "none";
            sheetDiv.className = "flex-1 overflow-auto";
            sheetDiv.appendChild(
              renderSheet(XLSX, workbook.Sheets[sheetName], sheetName)
            );
            sheetContents.push(sheetDiv);

            tab.onclick = () => {
              tabContainer.querySelectorAll("button").forEach((btn, i) => {
                btn.className =
                  i === index
                    ? "px-3 py-2 text-xs font-medium border-b-2 border-accent text-sidebar"
                    : "px-3 py-2 text-xs font-medium text-sidebar-muted hover:text-sidebar";
              });
              sheetContents.forEach((c, i) => {
                c.style.display = i === index ? "flex" : "none";
              });
            };
            tabContainer.appendChild(tab);
          });

          wrapper.appendChild(tabContainer);
          sheetContents.forEach((c) => wrapper.appendChild(c));
        } else {
          wrapper.appendChild(
            renderSheet(
              XLSX,
              workbook.Sheets[workbook.SheetNames[0]],
              workbook.SheetNames[0]
            )
          );
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load spreadsheet");
      }
    })();

    return () => { cancelled = true; };
  }, [content]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="rounded-lg border border-semantic-error/30 bg-semantic-error/10 p-4 text-sm text-semantic-error">
          <div className="font-medium mb-1">Error loading spreadsheet</div>
          <div className="text-xs opacity-90">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-sidebar-soft px-3 py-2">
        <button
          type="button"
          onClick={() => downloadBlob(decodeBase64(content), filename, getMimeType())}
          className="rounded-md p-1 text-sidebar-muted hover:text-sidebar"
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto min-h-0" />
    </div>
  );
}

function renderSheet(XLSX: any, worksheet: any, sheetName: string): HTMLElement {
  const div = document.createElement("div");
  const htmlTable = XLSX.utils.sheet_to_html(worksheet, {
    id: `sheet-${sheetName}`,
  });
  const temp = document.createElement("div");
  temp.innerHTML = htmlTable;
  const table = temp.querySelector("table");
  if (table) {
    table.className = "w-full border-collapse text-sidebar";
    table.querySelectorAll("td, th").forEach((cell) => {
      (cell as HTMLElement).className =
        "border border-sidebar-soft px-3 py-2 text-xs text-left";
    });
    const headers = table.querySelectorAll("thead th, tr:first-child td");
    headers.forEach((th) => {
      (th as HTMLElement).className =
        "border border-sidebar-soft px-3 py-2 text-xs font-semibold bg-sidebar-panel-strong text-sidebar sticky top-0";
    });
    table.querySelectorAll("tbody tr:nth-child(even)").forEach((row) => {
      (row as HTMLElement).classList.add("bg-sidebar-panel");
    });
    div.appendChild(table);
  }
  return div;
}
