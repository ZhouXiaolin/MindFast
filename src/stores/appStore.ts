import { create } from "zustand";

export type Lang = "en" | "zh";
export type ColorMode = "light" | "auto" | "dark";
export type ChatFont = "default" | "sans" | "system" | "dyslexic";

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  /** Base46 深色预设 id，见 themes/base46.ts */
  themePresetIdDark: string;
  setThemePresetIdDark: (id: string) => void;
  /** Base46 浅色预设 id */
  themePresetIdLight: string;
  setThemePresetIdLight: (id: string) => void;
  chatFont: ChatFont;
  setChatFont: (font: ChatFont) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  workspaceRevision: number;
  touchWorkspaceRevision: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  lang: "en",
  setLang: (lang) => set({ lang }),
  colorMode: "dark",
  setColorMode: (colorMode) => set({ colorMode }),
  themePresetIdDark: "default-dark",
  setThemePresetIdDark: (themePresetIdDark) => set({ themePresetIdDark }),
  themePresetIdLight: "default-light",
  setThemePresetIdLight: (themePresetIdLight) => set({ themePresetIdLight }),
  chatFont: "default",
  setChatFont: (chatFont) => set({ chatFont }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  userName: "Solaren",
  setUserName: (userName) => set({ userName }),
  userEmail: "user@example.com",
  setUserEmail: (userEmail) => set({ userEmail }),
  workspaceRevision: 0,
  touchWorkspaceRevision: () =>
    set((state) => ({ workspaceRevision: state.workspaceRevision + 1 })),
}));
