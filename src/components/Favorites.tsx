import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
};

const FavoritesContext = createContext<Ctx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("uc-favs") ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  const value = useMemo<Ctx>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle: (id) => {
        setIds((prev) => {
          const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
          localStorage.setItem("uc-favs", JSON.stringify(next));
          return next;
        });
      },
    }),
    [ids],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("FavoritesProvider requerido");
  return ctx;
}
