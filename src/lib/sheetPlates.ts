import { plateKey } from "./sources";
import type { Vehicle } from "../store/types";

/** null = no se pudo leer la hoja; no filtrar. */
export async function fetchSheetPlates(): Promise<Set<string> | null> {
  try {
    const res = await fetch("/api/sheet-plates", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; plates?: string[] };
    if (!data.ok || !Array.isArray(data.plates) || data.plates.length < 5) {
      return null;
    }
    return new Set(data.plates.map((p) => plateKey(p)));
  } catch {
    return null;
  }
}

export function filterToSheetPlates(list: Vehicle[], plates: Set<string> | null) {
  if (!plates) return list;
  return list.filter((car) => plates.has(plateKey(car.unidad)));
}
