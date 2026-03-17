import { create } from "zustand";

export type Lang = "en" | "zh";

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  userName: string;
  setUserName: (name: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  lang: "en",
  setLang: (lang) => set({ lang }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  userName: "Solaren",
  setUserName: (userName) => set({ userName }),
}));
