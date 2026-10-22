import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "../shared/catalog.mjs";
import { loadSheetPlates } from "../shared/sheetPlates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function readLocalCars() {
  return JSON.parse(readFileSync(path.join(root, "shared/local-catalog.json"), "utf8"));
}

export async function getCatalog() {
  return loadCatalog({ localCars: readLocalCars() });
}

export async function getSheetPlates() {
  try {
    return await loadSheetPlates();
  } catch {
    return null;
  }
}

export { decide, goneDocument, renderHtml } from "../shared/dispatch.mjs";
