/** Patentes vigentes en la pestaña UNIDADES CHILE (fuente de la vitrina). */
const SHEET_ID = "1BG2uR6APbXEMvVvRmdR-Nn0Vko6eobJ6Xam0XX41Ldc";
const TAB = "UNIDADES CHILE";

function plateKey(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
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

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TAB)}`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "UnidadesChile/1.0" },
    });
    if (!response.ok) {
      return res.status(502).json({ ok: false, plates: [] });
    }
    const csv = await response.text();
    const lines = csv.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      return res.status(200).json({ ok: true, plates: [] });
    }
    const headers = parseCsvLine(lines[0]).map((h) => h.trim().toUpperCase());
    const idx = headers.findIndex((h) => h.includes("PATENT"));
    const plateIdx = idx >= 0 ? idx : 1;
    const plates = [
      ...new Set(
        lines
          .slice(1)
          .map((line) => plateKey(parseCsvLine(line)[plateIdx] || ""))
          .filter((p) => p.length >= 5),
      ),
    ];
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({ ok: true, plates });
  } catch {
    return res.status(502).json({ ok: false, plates: [] });
  }
}
