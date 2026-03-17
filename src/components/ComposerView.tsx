import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Tabs from "@radix-ui/react-tabs";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/cn";
import { useAppStore } from "../stores/appStore";
import {
  Send,
  Plus,
  ChevronDown,
  PenLine,
  GraduationCap,
  Code,
  Briefcase,
  Lightbulb,
} from "lucide-react";

export function ComposerView() {
  const { t } = useTranslation();
  const userName = useAppStore((s) => s.userName);
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("write");

  return (
    <div className="flex h-full flex-col">
      {/* Top: Free plan · Upgrade (single pill, dot separator - matches demo) */}
      <div className="flex shrink-0 justify-center px-4 pt-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sidebar px-4 py-1.5 text-sm">
          <span className="text-sidebar-muted">{t("freePlan")}</span>
          <span className="text-sidebar-muted/80" aria-hidden>·</span>
          <a
            href="#upgrade"
            className="font-medium text-sidebar hover:opacity-90"
          >
            {t("upgrade")}
          </a>
        </div>
      </div>

      {/* Welcome: star + "Back at it, Solaren" */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-semantic-warning" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
            </svg>
          </span>
          <p className="text-xl text-app">
            {t("backAtIt", { name: userName })}
          </p>
        </div>

        {/* Composer card + Prompt categories directly below (not at viewport bottom) */}
        <div className="w-full max-w-2xl">
          <div
            className="rounded-2xl border border-sidebar bg-sidebar shadow-xl"
            role="group"
          >
            <div className="p-4">
              <textarea
                className="min-h-[120px] w-full resize-none bg-transparent text-app placeholder-sidebar-muted outline-none"
                rows={4}
                placeholder={t("howCanIHelp")}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                aria-label={t("writePromptToClaude")}
              />
            </div>
            <div className="flex items-center justify-between border-t border-sidebar px-3 py-2">
              <div className="flex items-center gap-0.5">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                      aria-label={t("toggleMenu")}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="min-w-35 rounded-lg border border-sidebar bg-sidebar p-1 shadow-lg text-sidebar"
                      sideOffset={6}
                    >
                      <DropdownMenu.Item
                        className="cursor-pointer rounded px-3 py-2 text-sm outline-none data-highlighted:bg-sidebar-hover"
                        onSelect={() => {}}
                      >
                        Attach file
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-sidebar-muted hover:bg-sidebar-hover"
                      aria-haspopup="menu"
                    >
                      {t("modelName")}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="min-w-40 rounded-lg border border-sidebar bg-sidebar p-1 shadow-lg text-sidebar"
                      sideOffset={6}
                    >
                      <DropdownMenu.Item
                        className="cursor-pointer rounded px-3 py-2 text-sm outline-none data-highlighted:bg-sidebar-hover"
                        onSelect={() => {}}
                      >
                        {t("modelName")}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar disabled:opacity-40"
                aria-label="Send"
                disabled={!prompt.trim()}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Prompt categories (Write, Learn, Code, Life stuff, Claude's choice) - right below input box */}
          <div className="mt-3 flex justify-center">
            <Tabs.Root value={category} onValueChange={setCategory}>
              <Tabs.List
                className="flex flex-wrap justify-center gap-1"
                aria-label="Prompt categories"
              >
                {[
                  { value: "write", key: "categoryWrite", icon: PenLine },
                  { value: "learn", key: "categoryLearn", icon: GraduationCap },
                  { value: "code", key: "categoryCode", icon: Code },
                  { value: "life", key: "categoryLife", icon: Briefcase },
                  { value: "choice", key: "categoryChoice", icon: Lightbulb },
                ].map(({ value, key, icon: Icon }) => (
                  <Tabs.Trigger
                    key={value}
                    value={value}
                    className={cn(
                      "flex items-center gap-2 rounded-full border border-sidebar bg-sidebar-hover/80 px-4 py-2 text-sm text-sidebar-muted transition-colors",
                      "hover:bg-sidebar-hover hover:text-sidebar",
                      "data-[state=active]:border-sidebar data-[state=active]:bg-sidebar-hover data-[state=active]:text-sidebar"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(key)}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
          </div>
        </div>
      </div>
    </div>
  );
}
