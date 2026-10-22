import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VEHICLE_PHOTOS_BUCKET } from "./_media.js";
import { carsAbsentFromSheet, purgeCarsMissingFromSheet, storagePathsForRemovedCar } from "./sheetRemoval.js";
import { platesFromSheetCsv } from "../../shared/sheetPlates.mjs";

const SLUG = "ford-ranger-4x4-2023-shyl53";
const HOST = "https://tuybpizjeszgwtcvunmp.supabase.co";

function photo(path) {
  return `${HOST}/storage/v1/object/public/${VEHICLE_PHOTOS_BUCKET}/${path}`;
}

function row(overrides = {}) {
  const slug = overrides.slug || SLUG;
  return {
    slug,
    plate: "SHYL53",
    status: "Disponible",
    image: photo(`unidades-chile/${slug}/portada.jpg`),
    gallery: [
      photo(`unidades-chile/${slug}/portada.jpg`),
      photo(`unidades-chile/${slug}/lateral.jpg`),
      `${HOST}/storage/v1/object/public/boletas-receipts/2024/boleta.pdf`,
      photo(`rg-motors/otro/no-tocar.jpg`),
    ],
    spin: {
      count: 2,
      pattern: photo(`unidades-chile/${slug}/spin/v9/m900/{i}.webp`),
      hiPattern: photo(`unidades-chile/${slug}/spin/v9/d1600/{i}.webp`),
    },
    ...overrides,
  };
}

describe("planilla de este sitio", () => {
  it("lee la columna de patente", () => {
    const csv = "MARCA,PATENTE,PRECIO\nFord,SHYL 53,1\nToyota,RZVK91,2\n,x,0\n";
    assert.deepEqual(platesFromSheetCsv(csv), ["SHYL53", "RZVK91"]);
  });

  it("no arma candidatos si la hoja viene corta", () => {
    const plates = new Set(["RZVK91", "PSJJ97"]);
    assert.deepEqual(carsAbsentFromSheet([row()], plates, 5), []);
  });
});

describe("sync al salir de la planilla", () => {
  it("despublica y borra fotos y tour 360, sin boletas ni pagos", async () => {
    const gone = row();
    const stays = row({
      slug: "toyota-hilux-4x4-2022-rzvk91",
      plate: "RZVK91",
      image: photo("unidades-chile/toyota-hilux-4x4-2022-rzvk91/a.jpg"),
      gallery: [],
      spin: null,
    });
    const plates = new Set(["RZVK91", "PSJJ97", "RGBP20", "RHCL44", "RPSH28"]);
    const paths = storagePathsForRemovedCar(gone);
    assert.ok(paths.includes(`unidades-chile/${SLUG}/portada.jpg`));
    assert.ok(paths.includes(`unidades-chile/${SLUG}/spin/v9/m900/001.webp`));
    assert.ok(paths.includes(`unidades-chile/${SLUG}/spin/v9/d1600/002.webp`));
    assert.equal(paths.some((path) => /boleta|pago|rg-motors/.test(path)), false);

    const root = `unidades-chile/${SLUG}`;
    const removed = [];
    const unpublished = [];
    const buckets = [];
    const state = {
      listByPrefix: {
        [root]: [
          { name: "portada.jpg", id: "p" },
          { name: "spin", id: null },
          { name: "pagos", id: null },
        ],
        [`${root}/spin`]: [{ name: "v9", id: null }],
        [`${root}/spin/v9`]: [
          { name: "m900", id: null },
          { name: "d1600", id: null },
        ],
        [`${root}/spin/v9/m900`]: [
          { name: "001.webp", id: "a" },
          { name: "002.webp", id: "b" },
        ],
        [`${root}/spin/v9/d1600`]: [{ name: "001.webp", id: "c" }],
        [`${root}/pagos`]: [{ name: "cuota.pdf", id: "pay" }],
      },
    };

    function admin() {
      return {
        storage: {
          from(bucket) {
            buckets.push(bucket);
            if (bucket !== VEHICLE_PHOTOS_BUCKET) {
              throw new Error(`Bucket protegido, no se borra: ${bucket}`);
            }
            return {
              async list(prefix) {
                return { data: state.listByPrefix[prefix] || [], error: null };
              },
              async remove(pathsToRemove) {
                removed.push(...pathsToRemove);
                return { error: null };
              },
            };
          },
        },
        from() {
          throw new Error("el test no escribe huérfanos ni boletas");
        },
      };
    }

    const result = await purgeCarsMissingFromSheet({
      minPlates: 5,
      loadPlates: async () => plates,
      loadRows: async () => [gone, stays],
      admin: admin(),
      unpublish: async (car) => {
        unpublished.push(car.slug);
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.skipped, false);
    assert.deepEqual(unpublished, [SLUG]);
    assert.equal(result.removed.length, 1);
    assert.equal(result.removed[0].plate, "SHYL53");
    assert.ok(result.removed[0].storage.deleted >= 4);
    assert.ok(removed.includes(`${root}/portada.jpg`));
    assert.ok(removed.includes(`${root}/lateral.jpg`));
    assert.ok(removed.includes(`${root}/spin/v9/m900/001.webp`));
    assert.ok(removed.includes(`${root}/spin/v9/m900/002.webp`));
    assert.ok(removed.includes(`${root}/spin/v9/d1600/001.webp`));
    assert.equal(removed.some((path) => /pagos|boleta|rg-motors|receipt/.test(path)), false);
    assert.deepEqual([...new Set(buckets)], [VEHICLE_PHOTOS_BUCKET]);
    assert.equal(JSON.stringify(result).includes("boletas-receipts"), false);
  });

  it("no borra nada si falta la service role", async () => {
    const plates = new Set(["AAAAA1", "BBBBB2", "CCCCC3", "DDDDD4", "EEEEE5"]);
    let listed = false;
    const result = await purgeCarsMissingFromSheet({
      loadPlates: async () => plates,
      loadRows: async () => [row()],
      admin: null,
      unpublish: async () => {
        listed = true;
      },
    });
    assert.equal(result.ok, false);
    assert.match(result.reason, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.equal(listed, false);
    assert.deepEqual(result.removed, []);
  });
});
