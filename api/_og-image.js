import { handleOg } from "../server/images.mjs";
import { getCatalog } from "../server/seoGate.mjs";
import { isCatalogHidden } from "../shared/vehiclePublic.mjs";

export const config = { runtime: "nodejs", maxDuration: 20 };

export default async function handler(req, res) {
  try {
    // Catálogo oculto: sin imagen por auto (responde 404 "sin foto").
    const catalog = isCatalogHidden() ? [] : await getCatalog();
    await handleOg(req, res, catalog);
  } catch {
    res.statusCode = 500;
    res.end("error");
  }
}
