import { getCatalog } from "../server/seoGate.mjs";
import { isCatalogHidden } from "../shared/vehiclePublic.mjs";

export const config = { runtime: "nodejs" };

export default async function handler(_req, res) {
  // Catálogo oculto: no exponer unidades (ni URLs de fotos) en el índice público.
  const rows = isCatalogHidden() ? [] : await getCatalog();
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=60, stale-while-revalidate=300");
  res.status(200).json(rows);
}
