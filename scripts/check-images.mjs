import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cars } from "../src/data/cars.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const banned = /estamos trabajando en las fotos/i;
const failures = [];

async function exists(rel) {
  try {
    await access(path.join(root, rel));
    return true;
  } catch {
    return false;
  }
}

const local = JSON.parse(await readFile(path.join(root, "shared/local-catalog.json"), "utf8"));
const ids = cars.map((car) => car.id).sort().join("\n");
const localIds = local.map((car) => car.id).sort().join("\n");
if (ids !== localIds) failures.push("shared/local-catalog.json no coincide con src/data/cars.ts");
for (const car of cars) {
  const row = local.find((item) => item.id === car.id);
  if (!row || Number(row.mercado) !== Number(car.mercado)) {
    failures.push(`mercado desactualizado en local-catalog: ${car.id}`);
  }
}

const files = new Set();
for (const car of cars) {
  for (const src of car.imagenes || []) {
    if (!src.startsWith("/")) {
      failures.push(`${car.id} usa una ruta que no es local: ${src}`);
      continue;
    }
    files.add(src);
  }
}
files.add("/images/placeholder-pending-car.svg");

for (const src of files) {
  const rel = path.join("public", src.replace(/^\/+/, ""));
  if (!(await exists(rel))) failures.push(`imagen rota: ${src}`);
}

const texts = [
  "public/images/placeholder-pending-car.svg",
  "src/admin/ui.tsx",
  "src/components/CarImage.tsx",
];
for (const rel of texts) {
  const body = await readFile(path.join(root, rel), "utf8");
  if (banned.test(body)) failures.push(`${rel} todavía usa el aviso de fotos en proceso`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`ok: ${files.size} imágenes locales`);
