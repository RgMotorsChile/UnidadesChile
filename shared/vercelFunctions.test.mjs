import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { apiRouteKey, resolveHandlerKey } from "./apiRoute.mjs";

const HOBBY_LIMIT = 12;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../api");

function listFunctions(dir, rel = "") {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith("_") || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const child = rel ? `${rel}/${name}` : name;
    if (statSync(full).isDirectory()) files.push(...listFunctions(full, child));
    else files.push(child);
  }
  return files;
}

test("Hobby admite como máximo 12 funciones y este repo deja una", () => {
  const files = listFunctions(root);
  assert.deepEqual(files, ["[[...route]].ts"]);
  assert.ok(files.length <= HOBBY_LIMIT);
});

test("el router reconoce las rutas públicas y de admin", () => {
  assert.equal(apiRouteKey("/api/html?path=catalogo/toyota"), "html");
  assert.equal(apiRouteKey("/api/sitemap"), "sitemap");
  assert.equal(apiRouteKey("/api/admin/photos?slug=toyota-hilux"), "admin/photos");
  assert.equal(apiRouteKey("/api/sheet-plates"), "sheet-plates");
  assert.equal(apiRouteKey("https://www.unidadeschile.cl/api/og-image?slug=x"), "og-image");
});

test("las páginas del sitio caen en html y una API desconocida no", () => {
  assert.equal(resolveHandlerKey("/catalogo"), "html");
  assert.equal(resolveHandlerKey("/catalogo/toyota-hilux-4x4-2022-rzvk91"), "html");
  assert.equal(resolveHandlerKey("/catalogo?path=catalogo"), "html");
  assert.equal(resolveHandlerKey("/consigna-tu-vehiculo"), "html");
  assert.equal(resolveHandlerKey("/api/html?path=catalogo"), "html");
  assert.equal(resolveHandlerKey("/sitemap.xml"), "sitemap");
  assert.equal(resolveHandlerKey("/api/sitemap"), "sitemap");
  assert.equal(resolveHandlerKey("/api/admin/photos?slug=toyota-hilux"), "admin/photos");
  assert.equal(resolveHandlerKey("/api/nope"), "");
  assert.equal(resolveHandlerKey("/api"), "");
});
