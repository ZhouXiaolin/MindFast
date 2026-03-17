import { create } from "zustand";

export interface BBox {
  id: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface RbushDemoState {
  items: BBox[];
  addItem: (item: BBox) => void;
  clearItems: () => void;
}

const defaultItems: BBox[] = [
  { id: "1", minX: 0, minY: 0, maxX: 100, maxY: 80 },
  { id: "2", minX: 50, minY: 50, maxX: 150, maxY: 120 },
  { id: "3", minX: 120, minY: 10, maxX: 200, maxY: 90 },
];

export const useRbushDemoStore = create<RbushDemoState>((set) => ({
  items: defaultItems,
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  clearItems: () => set({ items: [] }),
}));
