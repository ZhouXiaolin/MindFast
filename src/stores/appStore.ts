import { create } from "zustand";

export type Lang = "en" | "zh";
export type ColorMode = "light" | "auto" | "dark";

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
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
