import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../stores/appStore";
import {
  MessageSquarePlus,
  Search,
  Sliders,
  MessageCircle,
  FolderOpen,
  Box,
  Code,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
} from "lucide-react";

// Mock chat list for alignment with demo (many items to test sidebar scroll)
const MOCK_CHATS = [
  "华为发展历程的视觉展示",
  "全球电台播放应用界面设计",
  "任安的两难困境：刘据之变中的生死抉择",
  "Claude code skill中的subagent执行配置",
  "射雕英雄传的政治隐喻改编",
  "竞赛策略和方法",
  "在TUI中显示MathJax公式",
  "汉武帝巫蛊之乱的历史隐喻",
  "权力怪物的自我保护机制",
  "底线测试游戏",
  "计划书的建议和意见",
  "Prompt整理与重构",
  "MCP framework for complex task reasoning",
  "ModelScope 图片生成器文档整理",
  "球面纹理海洋背景色显示为白色",
  "古典诗词分析系统优化",
  "代码探索和实现工作流",
  "Polymarket中taker和maker的含义",
  "Adding sequential-thinking MCP to reasoning framework",
  "复古滤镜预设调整和编写",
  "微信密友功能的 Theos Hook 方案对比",
  "移除sequential-thinking相关描述",
  "中国古典诗词分析助手prompt优化",
  "古诗调试prompt生成规则",
  "集成acemcp语义搜索工具的配置优化",
  "优化Claude.md文件工作流程",
  "Remove auggie-mcp references and emphasize Serena",
  "Translating prompts for Claude code",
  "优化代码推理和工作流程",
  "设计异世界旅行app的概念",
  "React 与 Zustand 状态管理实践",
  "Tailwind CSS 深色主题配置",
  "Vite 构建优化与代码分割",
  "TypeScript 严格模式迁移指南",
  "Rust 与 WebAssembly 集成示例",
  "Tauri 窗口与系统托盘 API",
  "i18next 多语言切换与命名空间",
  "Radix UI 无障碍组件使用",
  "CanvasKit 与 2D 渲染性能",
  "RBush 空间索引与视口裁剪",
  "侧栏滚动与虚拟列表优化",
  "路由懒加载与预加载策略",
  "表单校验与错误边界处理",
  "主题切换与系统偏好检测",
  "键盘快捷键与焦点管理",
  "拖拽排序与撤销重做",
  "实时协作与冲突解决",
  "导出 Markdown 与 PDF",
  "搜索高亮与全文索引",
  "标签与文件夹管理",
  "暗色模式与对比度适配",
];

export function Layout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setLang, sidebarOpen, toggleSidebar, userName, userEmail } = useAppStore();
  const [recentsOpen, setRecentsOpen] = useState(true);

  const topLinks: { labelKey: string; path: string; icon: React.ReactNode }[] = [
    { labelKey: "newChat", path: "/new", icon: <MessageSquarePlus className="h-5 w-5 shrink-0" /> },
    { labelKey: "search", path: "/search", icon: <Search className="h-5 w-5 shrink-0" /> },
    { labelKey: "customize", path: "/customize", icon: <Sliders className="h-5 w-5 shrink-0" /> },
  ];

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

        {/* New chat, Search, Customize */}
        <nav className="shrink-0 gap-0.5 border-b border-sidebar p-2">
          {topLinks.map((item) => (
            <NavLink
              key={item.labelKey}
              to={item.path}
              end={item.path === "/"}
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
              {sidebarOpen && <span>{t(item.labelKey)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Middle: Chats / Projects / Artifacts / Code, then Recents + chat list, then All chats */}
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
                  onClick={() => setRecentsOpen((o) => !o)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                  aria-expanded={recentsOpen}
                >
                  <span>{t("recents")}</span>
                  <span className="text-xs">{recentsOpen ? t("hide") : t("show")}</span>
                </button>
                {recentsOpen && (
                  <ul className="list-none px-1" role="list">
                    {MOCK_CHATS.map((title, i) => (
                      <li key={i}>
                        <NavLink
                          to={`/chat/${i}`}
                          className={({ isActive }) =>
                            cn(
                              "block truncate rounded-lg px-3 py-2 text-sm",
                              isActive
                                ? "bg-sidebar-hover text-sidebar"
                                : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                            )
                          }
                        >
                          {title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
                <NavLink
                  to="/chats"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  {t("allChats")}
                </NavLink>
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
