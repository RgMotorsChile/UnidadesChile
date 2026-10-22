import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { decide } from "./dispatch.mjs";
import { urlFromHtmlFunction } from "./htmlRequest.mjs";
import { catalogFromLocal } from "./catalog.mjs";
import {
  carJson,
  isListedHere,
  pageSeo,
  plateKey,
  publicSlug,
  resolveVehicle,
  sitemapXml,
  stripPlate,
  vehicleDescription,
  vehicleTitle,
} from "./vehiclePublic.mjs";

const local = JSON.parse(readFileSync(new URL("./local-catalog.json", import.meta.url), "utf8"));
const catalog = catalogFromLocal(local);
const origin = "https://www.unidadeschile.cl";

test("el slug público no contiene la patente", () => {
  for (const car of catalog) {
    const slug = publicSlug(car);
    const plate = plateKey(car.unidad).toLowerCase();
    assert.ok(slug.length > 8, slug);
    assert.equal(slug.includes(plate), false, `${slug} incluye ${plate}`);
    assert.match(slug, new RegExp(`-${car.year}-`));
  }
  const slugs = catalog.map((car) => car.publicSlug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("la URL vieja redirige 301 y el vendido sale del sitemap", () => {
  const sample = catalog.find((car) => car.sucursal === "unidades-chile");
  assert.ok(sample);
  const legacy = resolveVehicle(sample.id, catalog);
  assert.equal(legacy.type, "redirect");
  assert.equal(legacy.status, 301);
  assert.equal(legacy.to, `/catalogo/${sample.publicSlug}`);

  const sold = { ...sample, status: "vendido", sucursal: "unidades-chile" };
  const goneSale = resolveVehicle(sample.publicSlug, [sold]);
  assert.equal(goneSale.type, "redirect");
  assert.equal(goneSale.to, "/catalogo?estado=vendido");

  const xml = sitemapXml(origin, catalog);
  assert.match(xml, new RegExp(`/catalogo/${sample.publicSlug}`));
  assert.equal(xml.includes(sample.id), false);
  assert.match(xml, /<lastmod>/);
});

test("fuera de la planilla de este sitio responde 410 aquí y no redirige a otro dominio", () => {
  const shyl = {
    id: "ford-ranger-4x4-2023-shyl53",
    unidad: "SHYL53",
    marca: "Ford",
    modelo: "Ranger",
    version: "4x4",
    year: 2023,
    precio: 1,
    km: 1,
    imagenes: [],
    status: "publicado",
    sucursal: "rg-motors",
    publicSlug: "ford-ranger-4x4-rojo-2023-7cm3a8",
    external: "https://www.rgmotorschile.cl/vehiculo/ford-ranger-4x4-rojo-2023-7cm3a8",
  };
  const stpz = catalog.find((car) => plateKey(car.unidad) === "STPZ87");
  const kept = catalog.find((car) => car.sucursal === "unidades-chile" && plateKey(car.unidad) !== "STPZ87");
  const plates = new Set([plateKey(kept.unidad), "LPCG80"]);
  const gone = resolveVehicle(shyl.id, [shyl, kept], plates);
  assert.equal(gone.type, "gone");
  assert.equal(gone.to, undefined);
  assert.equal(resolveVehicle(shyl.publicSlug, [shyl], plates).type, "gone");
  assert.equal(resolveVehicle(stpz.id, catalog, plates).type, "gone");
  assert.equal(resolveVehicle("mg-3-hatch-back-2022-rygb56", catalog, plates).type, "gone");
  assert.equal(resolveVehicle("no-existe", catalog, plates).type, "gone");
  const onSheet = resolveVehicle(shyl.id, [shyl], new Set(["SHYL53"]));
  assert.equal(onSheet.type, "redirect");
  assert.equal(onSheet.status, 301);
  assert.equal(onSheet.to, `/catalogo/${shyl.publicSlug}`);
  assert.equal(onSheet.to.startsWith("http"), false);
  const soldOffSheet = resolveVehicle(kept.publicSlug, [{ ...kept, status: "vendido" }], plates);
  assert.equal(soldOffSheet.to, "/catalogo?estado=vendido");
  const soldGone = resolveVehicle(stpz.publicSlug, [{ ...stpz, status: "vendido" }], plates);
  assert.equal(soldGone.type, "gone");
  const xml = sitemapXml(origin, [...catalog, shyl], plates);
  assert.match(xml, new RegExp(`/catalogo/${kept.publicSlug}`));
  assert.equal(xml.includes("shyl53"), false);
  assert.equal(xml.includes("rygb56"), false);
  assert.equal(xml.includes("stpz87"), false);
  assert.equal(xml.includes("rgmotorschile"), false);
  assert.equal(xml.includes("salgadoautomotriz"), false);
  assert.equal(isListedHere(shyl, plates), false);
  assert.equal(isListedHere(shyl, new Set(["SHYL53"])), true);
  const decision = decide(new URL(`${origin}/catalogo/${shyl.id}`), [shyl], plates);
  assert.equal(decision.type, "gone");
  const page = decide(new URL(`${origin}/catalogo`), catalog);
  assert.equal(page.seo.canonical, `${origin}/catalogo`);
  const home = decide(new URL(`${origin}/`), catalog);
  assert.equal(home.seo.canonical, `${origin}/`);
  assert.notEqual(page.seo.canonical, home.seo.canonical);
});

test("schema Car y textos sin patente", () => {
  const car = catalog.find((row) => row.sucursal === "unidades-chile" && row.km > 0 && row.precio > 0);
  const seo = pageSeo(origin, `/catalogo/${car.publicSlug}`, car);
  const node = seo.jsonLd["@graph"].find((item) => item["@type"] === "Car");
  assert.equal(node.offers.priceCurrency, "CLP");
  assert.equal(node.offers.price, car.precio);
  assert.match(node.offers.availability, /InStock/);
  assert.match(node.vehicleCondition, /UsedCondition/);
  assert.equal(node.mileageFromOdometer.unitCode, "KMT");
  assert.equal(node.mileageFromOdometer.value, car.km);
  assert.equal(node.modelDate, String(car.year));
  assert.equal(node.brand["@type"], "Brand");
  assert.ok(node.brand.name);
  assert.match(node.image, /^https:\/\//);
  assert.equal(seo.jsonLd["@graph"].some((item) => item["@type"] === "AutoDealer"), true);
  assert.equal(seo.jsonLd["@graph"].some((item) => item["@type"] === "BreadcrumbList"), true);
  assert.equal(seo.jsonLd["@graph"].some((item) => item["@type"] === "WebSite"), true);
  const blob = JSON.stringify(seo.jsonLd) + vehicleTitle(car) + vehicleDescription(car);
  assert.equal(blob.toLowerCase().includes(plateKey(car.unidad).toLowerCase()), false);
  assert.match(vehicleDescription(car), /\$200\.000/);
  assert.match(vehicleDescription(car), /prueba de manejo/);
  assert.match(vehicleTitle(car), /\$/);
  const pending = carJson(origin, { ...car, precio: 0, km: 0, year: car.year });
  assert.equal(pending.offers, undefined);
  assert.equal(pending.mileageFromOdometer, undefined);
  assert.match(stripPlate(`Unidad ${car.unidad} ${car.marca}`, car.unidad), new RegExp(car.marca, "i"));
});

test("la función HTML recupera la ruta pública que reescribió Vercel", () => {
  const plate = urlFromHtmlFunction(
    "/api/html?path=catalogo/toyota-hilux-4x4-2022-rzvk91",
    "www.unidadeschile.cl",
  );
  assert.equal(plate.pathname, "/catalogo/toyota-hilux-4x4-2022-rzvk91");
  assert.equal(plate.host, "www.unidadeschile.cl");

  const filtered = urlFromHtmlFunction("/api/html?path=catalogo&estado=vendido", "www.unidadeschile.cl");
  assert.equal(filtered.pathname, "/catalogo");
  assert.equal(filtered.searchParams.get("estado"), "vendido");
  assert.equal(filtered.searchParams.get("path"), null);

  const home = urlFromHtmlFunction("/api/html", "www.unidadeschile.cl");
  assert.equal(home.pathname, "/");
});
