/** Patentes vigentes en la pestaña UNIDADES CHILE. */
export const SHEET_ID = "1BG2uR6APbXEMvVvRmdR-Nn0Vko6eobJ6Xam0XX41Ldc";
export const SHEET_TAB = "UNIDADES CHILE";

/** Por debajo de esto la lectura se trata como fallida y no se borra stock. */
export const MIN_SHEET_PLATES = 5;

const CACHE_MS = 120_000;
let cache = null;

export function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function plateKey(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

/** Patentes de la columna PATENT, sin filtrar por tamaño mínimo. */
export function platesFromSheetCsv(csv) {
  const lines = String(csv || "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toUpperCase());
  const idx = headers.findIndex((header) => header.includes("PATENT"));
  const plateIdx = idx >= 0 ? idx : 1;
  return [
    ...new Set(
      lines
        .slice(1)
        .map((line) => plateKey(parseCsvLine(line)[plateIdx] || ""))
        .filter((plate) => plate.length >= 5),
    ),
  ];
}

export function clearSheetPlateCache() {
  cache = null;
}

/**
 * null = no se pudo leer una planilla usable. Quien publica no debe vaciar
 * el sitio en ese caso.
 */
export async function loadSheetPlates(fetchImpl = fetch) {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.plates;
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
  try {
    const response = await fetchImpl(url, {
      headers: { "User-Agent": "UnidadesChile/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const plates = platesFromSheetCsv(await response.text());
    if (plates.length < MIN_SHEET_PLATES) return null;
    const set = new Set(plates);
    cache = { at: Date.now(), plates: set };
    return set;
  } catch {
    return null;
  }
}
