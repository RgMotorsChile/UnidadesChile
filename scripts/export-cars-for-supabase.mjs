/**
 * Exporta seed de Unidades Chile a JSON para migrar a Supabase.
 *   node scripts/export-cars-for-supabase.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(ROOT, "scratch");
fs.mkdirSync(outDir, { recursive: true });

const carsTs = fs.readFileSync(path.join(ROOT, "src", "data", "cars.ts"), "utf8");
const marker = "export const cars: Car[] = ";
const idx = carsTs.indexOf(marker);
if (idx < 0) {
  console.error("No se encontró export const cars");
  process.exit(1);
}

const start = carsTs.indexOf("[", idx);
let depth = 0;
let end = -1;
for (let i = start; i < carsTs.length; i++) {
  const ch = carsTs[i];
  if (ch === "[") depth += 1;
  else if (ch === "]") {
    depth -= 1;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
if (end < 0) {
  console.error("No se pudo cerrar el array cars");
  process.exit(1);
}

const body = carsTs.slice(start, end + 1);
const cars = Function(`"use strict"; return (${body});`)();
const out = path.join(outDir, "cars-export.json");
fs.writeFileSync(out, JSON.stringify(cars, null, 2));
console.log("Wrote", out, "count", cars.length);
