import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../stores/appStore";
import { useSessionMetadataList } from "../hooks/useWorkspaceData";
import { createSessionId } from "../lib/workspace";
import {
  MessageSquarePlus,
  Search,
  MessageCircle,
  FolderOpen,
  Box,
  Code,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

export function Layout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setLang, sidebarOpen, toggleSidebar, userName, userEmail } = useAppStore();
  const { sessions } = useSessionMetadataList();
  const [recentsOpen, setRecentsOpen] = useState(true);
  const recentSessions = sessions.slice(0, 8);

  const listSectionLinks: { labelKey: string; path: string; icon: React.ReactNode }[] = [
    { labelKey: "chats", path: "/chats", icon: <MessageCircle className="h-5 w-5 shrink-0" /> },
    { labelKey: "projects", path: "/projects", icon: <FolderOpen className="h-5 w-5 shrink-0" /> },
    { labelKey: "artifacts", path: "/artifacts", icon: <Box className="h-5 w-5 shrink-0" /> },
    { labelKey: "code", path: "/code", icon: <Code className="h-5 w-5 shrink-0" /> },
  ];

  return (
    <div className="flex h-screen bg-app text-app">
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar bg-sidebar transition-[width]",
          sidebarOpen ? "w-56" : "w-14"
        )}
        role="navigation"
        aria-label="Sidebar"
      >
        {/* Top: app name + Close sidebar (collapsed: center button to align with icons) */}
        <div
          className={cn(
            "flex h-12 shrink-0 items-center border-b border-sidebar px-3",
            sidebarOpen ? "justify-between" : "justify-center"
          )}
        >
          {sidebarOpen && (
            <NavLink to="/" className="font-semibold text-sidebar">
              {t("app")}
            </NavLink>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="shrink-0 gap-0.5 border-b border-sidebar p-2">
          <button
            type="button"
            onClick={() => navigate(`/chat/${createSessionId()}`)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar",
              !sidebarOpen && "justify-center px-0"
            )}
          >
            <MessageSquarePlus className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{t("newChat")}</span>}
          </button>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                !sidebarOpen && "justify-center px-0",
                isActive
                  ? "bg-sidebar-hover text-sidebar"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
              )
            }
          >
            <Search className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{t("search")}</span>}
          </NavLink>
        </nav>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
            {listSectionLinks.map((item) => (
              <NavLink
                key={item.labelKey}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    !sidebarOpen && "justify-center px-0",
                    isActive
                      ? "bg-sidebar-hover text-sidebar"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                  )
                }
              >
                {item.icon}
                {sidebarOpen && (
                  <span className="min-w-0 flex-1 truncate">
                    {t(item.labelKey)}
                    {item.labelKey === "code" && (
                      <span className="ml-1 text-xs text-sidebar-muted">· {t("upgrade")}</span>
                    )}
                  </span>
                )}
              </NavLink>
            ))}

            {sidebarOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setRecentsOpen((open) => !open)}
                  className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                  aria-expanded={recentsOpen}
                >
                  <span>{t("recents")}</span>
                  <span className="text-xs">{recentsOpen ? t("hide") : t("show")}</span>
                </button>

                {recentsOpen ? (
                  recentSessions.length > 0 ? (
                    <ul className="list-none space-y-1 px-1" role="list">
                      {recentSessions.map((session) => (
                        <li key={session.id}>
                          <NavLink
                            to={`/chat/${session.id}`}
                            className={({ isActive }) =>
                              cn(
                                "block truncate rounded-lg px-3 py-2 text-sm",
                                isActive
                                  ? "bg-sidebar-hover text-sidebar"
                                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                              )
                            }
                          >
                            {session.title || t("untitledChat")}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-3 py-2 text-sm text-sidebar-muted">
                      {t("noChatsYet")}
                    </div>
                  )
                ) : null}
              </>
            )}
          </div>
        
          {/* Bottom: User */}
          <div className="shrink-0 border-t border-sidebar p-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-sidebar-muted hover:bg-sidebar-hover",
                    !sidebarOpen && "justify-center px-0"
                  )}
                  aria-haspopup="menu"
                  aria-label={`${userName}, ${t("userSettings")}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-hover text-xs font-medium text-sidebar">
                    {userName.slice(0, 2).toUpperCase()}
                  </span>
                  {sidebarOpen && (
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sidebar">{userName}</div>
                      <div className="truncate text-xs text-sidebar-muted">{t("freePlan")}</div>
                    </div>
                  )}
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[220px] rounded-lg border border-sidebar bg-sidebar py-1.5 shadow-xl text-sidebar z-50"
                  sideOffset={6}
                  side="left"
                  align="end"
                >
                  <div className="px-3 py-2 text-sm text-sidebar-muted">
                    {userEmail}
                  </div>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-none px-3 py-2 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                    onSelect={() => navigate("/settings/general")}
                  >
                    <span className="flex w-full justify-between">
                      <span>{t("userSettings")}</span>
                      <span className="text-xs text-sidebar-muted">{t("settingsShortcut")}</span>
                    </span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="cursor-pointer rounded-none px-3 py-2 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover data-[state=open]:bg-sidebar-hover">
                      {t("lang")}
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent
                        className="min-w-40 rounded-lg border border-sidebar bg-sidebar p-1 shadow-lg"
                        sideOffset={4}
                      >
                        <DropdownMenu.Item
                          className="cursor-pointer rounded px-2 py-1.5 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                          onSelect={() => setLang("en")}
                        >
                          English
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="cursor-pointer rounded px-2 py-1.5 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                          onSelect={() => setLang("zh")}
                        >
                          中文
                        </DropdownMenu.Item>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-none px-3 py-2 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                    onSelect={() => {}}
                  >
                    {t("getHelp")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-sidebar-border" />
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-none px-3 py-2 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                    onSelect={() => {}}
                  >
                    {t("upgradePlan")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-none px-3 py-2 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                    onSelect={() => {}}
                  >
                    {t("getApps")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-none px-3 py-2 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                    onSelect={() => {}}
                  >
                    {t("giftClaude")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="cursor-pointer rounded-none px-3 py-2 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover data-[state=open]:bg-sidebar-hover">
                      {t("learnMore")}
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent
                        className="min-w-40 rounded-lg border border-sidebar bg-sidebar p-1 shadow-lg"
                        sideOffset={4}
                      >
                        <DropdownMenu.Item
                          className="cursor-pointer rounded px-2 py-1.5 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                          onSelect={() => {}}
                        >
                          Docs
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="cursor-pointer rounded px-2 py-1.5 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                          onSelect={() => {}}
                        >
                          Blog
                        </DropdownMenu.Item>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Separator className="my-1 h-px bg-sidebar-border" />
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-none px-3 py-2 text-sm text-sidebar outline-none data-highlighted:bg-sidebar-hover"
                    onSelect={() => {}}
                  >
                    {t("logOut")}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex flex-1 flex-col overflow-auto" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
