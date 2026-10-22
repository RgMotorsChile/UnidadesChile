import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { decide } from "./dispatch.mjs";
import { catalogFromLocal } from "./catalog.mjs";
import {
  OTHER_BRANCH,
  carJson,
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
  assert.equal(xml.includes("shyl53"), false);
  assert.equal(xml.includes("rygb56"), false);
  assert.equal(xml.includes("stpz87"), false);
  assert.match(xml, /<lastmod>/);
});

test("301 cruzado solo si la patente está en una sola planilla ajena", () => {
  const shyl = resolveVehicle(OTHER_BRANCH.SHYL53.legacySlug, catalog);
  assert.equal(shyl.status, 301);
  assert.equal(shyl.to, "https://www.rgmotorschile.cl/vehiculo/ford-ranger-4x4-rojo-2023-7cm3a8");
  assert.equal(shyl.to.includes("shyl53"), false);
  const stpz = resolveVehicle(OTHER_BRANCH.STPZ87.legacySlug, catalog);
  assert.equal(stpz.status, 301);
  assert.equal(stpz.to, "https://www.rgmotorschile.cl/vehiculo/maxus-t60-4x2-at-gris-2023-n57nph");
  const lfst = resolveVehicle(OTHER_BRANCH.LFST41.legacySlug, catalog);
  assert.equal(lfst.status, 301);
  assert.equal(lfst.to, "https://www.rgmotorschile.cl/vehiculo/mitsubishi-l200-katana-cr-4x2-rojo-2019-36h57g");
  assert.equal(OTHER_BRANCH.RYGB56, undefined);
  const rygb = resolveVehicle("mg-3-hatch-back-2022-rygb56", catalog);
  assert.equal(rygb.type, "missing");
  const shared = {
    id: "hyundai-tucson-gl-2-0-2014-ghtd24",
    unidad: "GHTD 24",
    marca: "Hyundai",
    modelo: "Tucson",
    version: "Tucson",
    year: 2014,
    precio: 1,
    km: 1,
    imagenes: [],
    status: "publicado",
    sucursal: "rg-motors",
    publicSlug: "hyundai-tucson-gl-2-0-blanco-2014-u7skaq",
    external: "https://www.rgmotorschile.cl/vehiculo/hyundai-tucson-gl-2-0-2014-ghtd24",
  };
  assert.equal(resolveVehicle(shared.id, [shared]).type, "missing");
  assert.equal(resolveVehicle(shared.publicSlug, [shared]).type, "missing");
  const kept = {
    ...shared,
    id: "mitsubishi-l200-katana-crt-4x4-2019-lpcg80",
    unidad: "LPCG 80",
    sucursal: "unidades-chile",
    publicSlug: "mitsubishi-l200-katana-crt-4x4-2019-pq8ymm",
    external: null,
  };
  assert.equal(resolveVehicle(kept.publicSlug, [kept]).type, "ok");
  for (const plate of ["GHTD24", "HLXB59", "RZKV76", "RYGB56", "JRTH26", "LWRS59"]) {
    assert.equal(OTHER_BRANCH[plate], undefined);
  }
  const xml = sitemapXml(origin, catalog);
  assert.equal(xml.includes("rygb56"), false);
  const decision = decide(new URL(`${origin}/catalogo`), catalog);
  assert.equal(decision.seo.canonical, `${origin}/catalogo`);
  const home = decide(new URL(`${origin}/`), catalog);
  assert.equal(home.seo.canonical, `${origin}/`);
  assert.notEqual(decision.seo.canonical, home.seo.canonical);
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
