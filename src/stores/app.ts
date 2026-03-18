import { create } from "zustand";

export type Lang = "en" | "zh";
export type ColorMode = "light" | "auto" | "dark";
export type ChatFont = "default" | "sans" | "system" | "dyslexic";

export interface AppSettings {
  lang: Lang;
  colorMode: ColorMode;
  themePresetIdDark: string;
  themePresetIdLight: string;
  chatFont: ChatFont;
  sidebarOpen: boolean;
  userName: string;
  userEmail: string;
}

interface AppState extends AppSettings {
  hydrated: boolean;
  setLang: (lang: Lang) => void;
  setColorMode: (mode: ColorMode) => void;
  /** Base46 深色预设 id，见 themes/base46.ts */
  setThemePresetIdDark: (id: string) => void;
  /** Base46 浅色预设 id */
  setThemePresetIdLight: (id: string) => void;
  setChatFont: (font: ChatFont) => void;
  toggleSidebar: () => void;
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  workspaceRevision: number;
  touchWorkspaceRevision: () => void;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  lang: "en",
  colorMode: "dark",
  themePresetIdDark: "default-dark",
  themePresetIdLight: "default-light",
  chatFont: "default",
  sidebarOpen: true,
  userName: "Solaren",
  userEmail: "user@example.com",
};

export function selectAppSettings(state: AppSettings): AppSettings {
  return {
    lang: state.lang,
    colorMode: state.colorMode,
    themePresetIdDark: state.themePresetIdDark,
    themePresetIdLight: state.themePresetIdLight,
    chatFont: state.chatFont,
    sidebarOpen: state.sidebarOpen,
    userName: state.userName,
    userEmail: state.userEmail,
  };
}

export function getAppSettingsSnapshot(): AppSettings {
  return selectAppSettings(useAppStore.getState());
}

export function applyAppSettings(settings: Partial<AppSettings>): void {
  useAppStore.setState((state) => ({
    ...state,
    ...settings,
    hydrated: true,
  }));
}

export const useAppStore = create<AppState>((set) => ({
  ...DEFAULT_APP_SETTINGS,
  hydrated: false,
  setLang: (lang) => set({ lang }),
  setColorMode: (colorMode) => set({ colorMode }),
  setThemePresetIdDark: (themePresetIdDark) => set({ themePresetIdDark }),
  setThemePresetIdLight: (themePresetIdLight) => set({ themePresetIdLight }),
  setChatFont: (chatFont) => set({ chatFont }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setUserName: (userName) => set({ userName }),
  setUserEmail: (userEmail) => set({ userEmail }),
  workspaceRevision: 0,
  touchWorkspaceRevision: () =>
    set((state) => ({ workspaceRevision: state.workspaceRevision + 1 })),
}));
