import type { Vehicle } from "../store/types";

export type BrandRow = {
  marca: string;
  n: number;
  valor: number;
  precioPromedio: number;
  ahorroPct: number;
};

export type CatalogStats = {
  n: number;
  publicados: number;
  borradores: number;
  reservados: number;
  vendidos: number;
  valorInventario: number;
  precioPromedio: number;
  precioMediana: number;
  kmPromedio: number;
  ahorroPromedioPct: number;
  ahorroTotal: number;
  porMarca: BrandRow[];
  porCarroceria: { label: string; n: number }[];
  porAnio: { year: number; n: number }[];
  histogramaPrecio: { bucket: string; n: number }[];
};

function median(values: number[]) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function catalogStats(vehicles: Vehicle[]): CatalogStats {
  const n = vehicles.length;
  const publicados = vehicles.filter((v) => v.status === "publicado").length;
  const borradores = vehicles.filter((v) => v.status === "borrador").length;
  const reservados = vehicles.filter((v) => v.status === "reservado").length;
  const vendidos = vehicles.filter((v) => v.status === "vendido").length;
  const live = vehicles.filter((v) => v.status === "publicado" || v.status === "reservado");
  const precios = live.map((v) => v.precio);
  const kms = live.map((v) => v.km);
  const ahorros = live.map((v) => (v.mercado > 0 ? (v.mercado - v.precio) / v.mercado : 0));

  const byBrand = new Map<string, Vehicle[]>();
  for (const v of live) {
    const list = byBrand.get(v.marca) ?? [];
    list.push(v);
    byBrand.set(v.marca, list);
  }

  const porMarca: BrandRow[] = [...byBrand.entries()]
    .map(([marca, list]) => ({
      marca,
      n: list.length,
      valor: list.reduce((s, v) => s + v.precio, 0),
      precioPromedio: mean(list.map((v) => v.precio)),
      ahorroPct: mean(list.map((v) => (v.mercado > 0 ? (v.mercado - v.precio) / v.mercado : 0))) * 100,
    }))
    .sort((a, b) => b.n - a.n);

  const body = new Map<string, number>();
  for (const v of live) body.set(v.carroceria, (body.get(v.carroceria) ?? 0) + 1);
  const porCarroceria = [...body.entries()]
    .map(([label, count]) => ({ label, n: count }))
    .sort((a, b) => b.n - a.n);

  const years = new Map<number, number>();
  for (const v of live) years.set(v.year, (years.get(v.year) ?? 0) + 1);
  const porAnio = [...years.entries()]
    .map(([year, count]) => ({ year, n: count }))
    .sort((a, b) => b.year - a.year);

  const edges = [0, 12_000_000, 16_000_000, 20_000_000, 25_000_000, 35_000_000, Infinity];
  const labels = ["< $12M", "$12–16M", "$16–20M", "$20–25M", "$25–35M", "$35M+"];
  const hist = labels.map((bucket) => ({ bucket, n: 0 }));
  for (const p of precios) {
    const i = edges.findIndex((_, idx) => p >= edges[idx] && p < edges[idx + 1]);
    if (i >= 0) hist[i].n += 1;
  }

  return {
    n,
    publicados,
    borradores,
    reservados,
    vendidos,
    valorInventario: live.reduce((s, v) => s + v.precio, 0),
    precioPromedio: mean(precios),
    precioMediana: median(precios),
    kmPromedio: mean(kms),
    ahorroPromedioPct: mean(ahorros) * 100,
    ahorroTotal: live.reduce((s, v) => s + Math.max(0, v.mercado - v.precio), 0),
    porMarca,
    porCarroceria,
    porAnio,
    histogramaPrecio: hist,
  };
}

export function vehiclesToCsv(vehicles: Vehicle[]) {
  const headers = [
    "id",
    "unidad",
    "marca",
    "modelo",
    "version",
    "year",
    "precio",
    "mercado",
    "ahorro",
    "ahorro_pct",
    "km",
    "transmision",
    "combustible",
    "traccion",
    "duenos",
    "carroceria",
    "ciudad",
    "status",
    "destacado",
    "certificado",
    "cuota",
    "vistas",
    "createdAt",
    "updatedAt",
  ];
  const rows = vehicles.map((v) => {
    const ahorro = v.mercado - v.precio;
    const pct = v.mercado > 0 ? ((ahorro / v.mercado) * 100).toFixed(2) : "0";
    return [
      v.id,
      v.unidad,
      v.marca,
      v.modelo,
      v.version,
      v.year,
      v.precio,
      v.mercado,
      ahorro,
      pct,
      v.km,
      v.transmision,
      v.combustible,
      v.traccion,
      v.duenos,
      v.carroceria,
      v.ciudad,
      v.status,
      v.destacado,
      v.certificado,
      v.cuota,
      v.vistas,
      v.createdAt,
      v.updatedAt,
    ]
      .map((cell) => {
        const s = String(cell);
        return s.includes(",") || s.includes("\"") || s.includes("\n") ? `"${s.replaceAll("\"", "\"\"")}"` : s;
      })
      .join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
