import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const MAX = 3;
const KEY = "uc-compare";

type Ctx = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => boolean;
  clear: () => void;
  setIds: (ids: string[]) => void;
};

const CompareContext = createContext<Ctx | null>(null);

function readStored() {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]).slice(0, MAX);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIdsState] = useState<string[]>(readStored);

  const persist = (next: string[]) => {
    const clean = next.slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(clean));
    setIdsState(clean);
  };

  const value = useMemo<Ctx>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle: (id) => {
        if (ids.includes(id)) {
          persist(ids.filter((x) => x !== id));
          return true;
        }
        if (ids.length >= MAX) return false;
        persist([...ids, id]);
        return true;
      },
      clear: () => persist([]),
      setIds: persist,
    }),
    [ids],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("CompareProvider requerido");
  return ctx;
}
