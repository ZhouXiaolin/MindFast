import { useMemo, useEffect } from "react";
import RBush from "rbush";

export interface RBushItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id?: string;
}

export function useRbush<T extends RBushItem>(items: T[]) {
  const tree = useMemo(() => new RBush<T>(), []);

  useEffect(() => {
    tree.clear();
    tree.load(items);
  }, [tree, items]);

  const search = useMemo(
    () => (minX: number, minY: number, maxX: number, maxY: number) =>
      tree.search({ minX, minY, maxX, maxY }),
    [tree]
  );

  return { tree, search };
}
