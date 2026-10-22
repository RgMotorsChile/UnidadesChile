import { platesFromSheetCsv, SHEET_ID, SHEET_TAB } from "../shared/sheetPlates.mjs";

/** Patentes vigentes en la pestaña UNIDADES CHILE (fuente de la vitrina). */
export default async function handler(
  req: { method?: string },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (code: number) => { json: (body: unknown) => void };
  },
) {
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ ok: false, plates: [] });
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "UnidadesChile/1.0" },
    });
    if (!response.ok) {
      return res.status(502).json({ ok: false, plates: [] });
    }
    const plates = platesFromSheetCsv(await response.text());
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({ ok: true, plates });
  } catch {
    return res.status(502).json({ ok: false, plates: [] });
  }
}
