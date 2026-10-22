import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  ORPHAN_REASONS,
  ORPHAN_TABLE,
  VEHICLE_PHOTOS_BUCKET,
  buildObjectPath,
  deleteStoredPhotos,
  dropReason,
  droppedStoragePaths,
  expandSpinPatterns,
  isProtectedStoragePath,
  listSlugObjectPaths,
  objectPathFromPublicUrl,
  publicObjectUrl,
  safeSlug,
  storeMediaFile,
} from "./_media.js";

const HOST = "https://tuybpizjeszgwtcvunmp.supabase.co";
const SLUG = "mitsubishi-l200-2020-lxcy98";

function urlFor(path) {
  return `${HOST}/storage/v1/object/public/${VEHICLE_PHOTOS_BUCKET}/${path}`;
}

function sha(text) {
  return createHash("sha256").update(text).digest("hex");
}

describe("paths de Storage", () => {
  it("nombra la foto por hash bajo unidades-chile/<slug>/", () => {
    const bytes = Buffer.from("a");
    const path = buildObjectPath({ bytes, slug: SLUG, contentType: "image/jpeg" });
    assert.equal(path, `unidades-chile/${SLUG}/${sha("a")}.jpg`);
    assert.equal(sha("a"), "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb");
  });

  it("el mismo contenido produce el mismo path y otro contenido no", () => {
    const a = buildObjectPath({ bytes: Buffer.from("foto"), slug: SLUG, contentType: "image/webp" });
    const b = buildObjectPath({ bytes: Buffer.from("foto"), slug: SLUG, contentType: "image/webp" });
    const c = buildObjectPath({ bytes: Buffer.from("otra"), slug: SLUG, contentType: "image/webp" });
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.match(a, /\.webp$/);
  });

  it("rechaza slugs que salen de la carpeta del auto", () => {
    assert.equal(safeSlug("../rg-motors"), "");
    assert.equal(safeSlug("unidades-chile/otro"), "");
    assert.throws(() => buildObjectPath({ bytes: Buffer.from("a"), slug: "../x", contentType: "image/png" }));
  });

  it("recupera el path desde la URL pública o firmada", () => {
    const path = `unidades-chile/${SLUG}/abc.jpg`;
    assert.equal(objectPathFromPublicUrl(publicObjectUrl(path)), path);
    assert.equal(
      objectPathFromPublicUrl(`${HOST}/storage/v1/object/sign/${VEHICLE_PHOTOS_BUCKET}/${path}?token=1`),
      path,
    );
    assert.equal(objectPathFromPublicUrl("https://xxx.blob.vercel-storage.com/cars/a.jpg"), "");
    assert.equal(objectPathFromPublicUrl("https://drive.google.com/thumbnail?id=1"), "");
    assert.equal(objectPathFromPublicUrl("/cars/hero-l200.png"), "");
  });
});

describe("fotos que ya no están en la ficha", () => {
  const kept = urlFor(`unidades-chile/${SLUG}/queda.jpg`);
  const gone = urlFor(`unidades-chile/${SLUG}/sale.jpg`);
  const other = urlFor("rg-motors/otro/sale.jpg");

  it("solo devuelve paths de este auto que desaparecieron", () => {
    const dropped = droppedStoragePaths(
      [kept, gone, other, "https://drive.google.com/thumbnail?id=9", "/cars/stock/lxcy98/00.jpg"],
      [kept],
      SLUG,
    );
    assert.deepEqual(dropped, [`unidades-chile/${SLUG}/sale.jpg`]);
  });

  it("marca replaced solo cuando entra otra foto de Storage", () => {
    const incoming = urlFor(`unidades-chile/${SLUG}/nueva.jpg`);
    assert.equal(dropReason([gone], [incoming], SLUG), "replaced");
    assert.equal(dropReason([gone, kept], [kept], SLUG), "removed");
  });
});

function fakeAdmin(state) {
  return {
    storage: {
      from(bucket) {
        state.buckets.push(bucket);
        return {
          async list(prefix) {
            if (state.listError) return { data: null, error: { message: state.listError } };
            if (state.listByPrefix) return { data: state.listByPrefix[prefix] || [], error: null };
            const root = `unidades-chile/${SLUG}`;
            if (prefix !== root) return { data: [], error: null };
            return { data: state.listed || [], error: null };
          },
          async remove(paths) {
            state.removed.push(paths);
            const failing = (paths || []).filter((path) => state.failPaths?.has(path));
            if (paths.length > 1 && failing.length) return { error: { message: "batch failed" } };
            if (failing.length) return { error: { message: `fail ${failing[0]}`, statusCode: state.failStatus || "500" } };
            return { error: null };
          },
        };
      },
    },
    from(table) {
      state.tables.push(table);
      return {
        async upsert(rows) {
          if (state.insertError) return { error: { message: state.insertError } };
          state.orphans.push(...rows);
          return { error: null };
        },
      };
    },
  };
}

describe("borrado inmediato", () => {
  it("borra después del cambio y no registra huérfanos si Storage responde", async () => {
    const state = { buckets: [], tables: [], removed: [], orphans: [], listed: [] };
    const path = `unidades-chile/${SLUG}/abc.jpg`;
    const result = await deleteStoredPhotos(
      { paths: [path, "rg-motors/otro/abc.jpg"], slug: SLUG, reason: "removed" },
      { admin: fakeAdmin(state) },
    );
    assert.deepEqual(result, { deleted: 1, orphans: 0, orphanError: "" });
    assert.deepEqual(state.removed, [[path]]);
    assert.equal(state.orphans.length, 0);
    assert.deepEqual(state.buckets, [VEHICLE_PHOTOS_BUCKET]);
  });

  it("si un archivo falla, lo encola y borra el resto", async () => {
    const ok = `unidades-chile/${SLUG}/ok.jpg`;
    const bad = `unidades-chile/${SLUG}/bad.jpg`;
    const state = {
      buckets: [],
      tables: [],
      removed: [],
      orphans: [],
      failPaths: new Set([bad]),
    };
    const result = await deleteStoredPhotos(
      { paths: [ok, bad], slug: SLUG, reason: "replaced" },
      { admin: fakeAdmin(state) },
    );
    assert.equal(result.deleted, 1);
    assert.equal(result.orphans, 1);
    assert.equal(state.tables[0], ORPHAN_TABLE);
    assert.equal(state.orphans[0].object_path, bad);
    assert.equal(state.orphans[0].reason, "replaced");
    assert.equal(state.orphans[0].tenant_slug, "unidades-chile");
    assert.equal(state.orphans[0].purged_at, null);
    assert.match(state.orphans[0].public_url, new RegExp(`/vehicle-photos/${bad}$`));
  });

  it("un 404 no es huérfano", async () => {
    const path = `unidades-chile/${SLUG}/ya-no.jpg`;
    const state = {
      buckets: [],
      tables: [],
      removed: [],
      orphans: [],
      failPaths: new Set([path]),
      failStatus: "404",
    };
    const result = await deleteStoredPhotos({ paths: [path], slug: SLUG, reason: "deleted" }, { admin: fakeAdmin(state) });
    assert.equal(result.deleted, 1);
    assert.equal(result.orphans, 0);
  });

  it("al vender lista la carpeta del auto y, si no puede, registra el prefijo", async () => {
    const listed = `unidades-chile/${SLUG}/desde-sync.jpg`;
    const state = {
      buckets: [],
      tables: [],
      removed: [],
      orphans: [],
      listed: [
        { name: "desde-sync.jpg", id: "file-1" },
        { name: "carpeta", id: null },
        { name: ".emptyFolderPlaceholder", id: "ph" },
      ],
    };
    const result = await deleteStoredPhotos(
      { paths: [], slug: SLUG, reason: "sold", listSlug: true },
      { admin: fakeAdmin(state) },
    );
    assert.equal(result.deleted, 1);
    assert.deepEqual(state.removed[0], [listed]);

    const broken = { buckets: [], tables: [], removed: [], orphans: [], listError: "timeout" };
    const failed = await deleteStoredPhotos(
      { paths: [], slug: SLUG, reason: "sold", listSlug: true },
      { admin: fakeAdmin(broken) },
    );
    assert.equal(failed.orphans, 1);
    assert.equal(broken.orphans[0].object_path, `unidades-chile/${SLUG}/`);
    assert.equal(broken.orphans[0].public_url, "");
    assert.equal(broken.orphans[0].reason, "sold");
  });

  it("lista el tour 360 anidado y deja fuera pagos y boletas", async () => {
    const root = `unidades-chile/${SLUG}`;
    const frame = `${root}/spin/v1/m900/001.webp`;
    const photo = `${root}/foto.jpg`;
    const state = {
      buckets: [],
      tables: [],
      removed: [],
      orphans: [],
      listByPrefix: {
        [root]: [
          { name: "foto.jpg", id: "file" },
          { name: "spin", id: null },
          { name: "pagos", id: null },
          { name: "boletas", id: null },
        ],
        [`${root}/spin`]: [{ name: "v1", id: null }],
        [`${root}/spin/v1`]: [{ name: "m900", id: null }],
        [`${root}/spin/v1/m900`]: [{ name: "001.webp", id: "frame" }],
        [`${root}/pagos`]: [{ name: "cuota.pdf", id: "pay" }],
        [`${root}/boletas`]: [{ name: "boleta.pdf", id: "bill" }],
      },
    };
    const listed = await listSlugObjectPaths(fakeAdmin(state), SLUG);
    assert.deepEqual(listed.sort(), [frame, photo].sort());
    const pattern = `https://tuybpizjeszgwtcvunmp.supabase.co/storage/v1/object/public/vehicle-photos/${root}/spin/v1/m900/{i}.webp`;
    const frames = expandSpinPatterns({ count: 2, pattern, hiPattern: pattern.replace("m900", "d1600") });
    assert.equal(frames.length, 4);
    assert.equal(expandSpinPatterns({ count: 400, pattern }).length, 360);
    assert.equal(
      expandSpinPatterns({
        count: 1,
        pattern: "https://tuybpizjeszgwtcvunmp.supabase.co/storage/v1/object/public/boletas-receipts/a/{i}.pdf",
      }).length,
      1,
    );
    assert.equal(isProtectedStoragePath(`${root}/pagos/cuota.pdf`), true);
    const result = await deleteStoredPhotos(
      {
        paths: [
          photo,
          `${root}/pagos/cuota.pdf`,
          "boletas-receipts/2024/a.pdf",
          "rg-motors/otro/foto.jpg",
        ],
        slug: SLUG,
        reason: "removed",
        listSlug: true,
      },
      { admin: fakeAdmin(state) },
    );
    assert.equal(result.deleted, 2);
    const flat = state.removed.flat();
    assert.ok(flat.includes(photo));
    assert.ok(flat.includes(frame));
    assert.equal(flat.some((path) => /pagos|boleta|rg-motors/.test(path)), false);
    assert.deepEqual([...new Set(state.buckets)], [VEHICLE_PHOTOS_BUCKET]);
  });
});

describe("subida", () => {
  it("sube al bucket con el path hasheado", async () => {
    let uploaded;
    const admin = {
      storage: {
        from(bucket) {
          return {
            async upload(path, body, options) {
              uploaded = { bucket, path, body, options };
              return { error: null };
            },
          };
        },
      },
    };
    const bytes = Buffer.from("a");
    const stored = await storeMediaFile(
      { bytes, slug: SLUG, contentType: "image/png" },
      { admin },
    );
    assert.equal(uploaded.bucket, VEHICLE_PHOTOS_BUCKET);
    assert.equal(uploaded.path, `unidades-chile/${SLUG}/${sha("a")}.png`);
    assert.equal(uploaded.options.upsert, true);
    assert.equal(stored.url, publicObjectUrl(uploaded.path));
    assert.equal(stored.storage, "supabase");
  });
});

describe("contrato y configuración", () => {
  it("la migración documenta la tabla que consume el job de huérfanos", () => {
    const sql = readFileSync(
      new URL("../../supabase/migrations/20261022120000_vehicle_photo_orphans.sql", import.meta.url),
      "utf8",
    );
    assert.match(sql, new RegExp(`create table if not exists public\\.${ORPHAN_TABLE}`));
    for (const reason of ORPHAN_REASONS) assert.match(sql, new RegExp(`'${reason}'`));
    assert.doesNotMatch(sql, /delete_after/);
    assert.match(sql, /purged_at/);
    assert.match(sql, /vehicle-photos/);
  });

  it("la CSP deja cargar fotos desde el dominio de Supabase", () => {
    const vercel = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
    const csp = vercel.headers
      .flatMap((entry) => entry.headers || [])
      .find((header) => header.key === "Content-Security-Policy").value;
    const img = csp.split(";").find((part) => part.trim().startsWith("img-src"));
    const connect = csp.split(";").find((part) => part.trim().startsWith("connect-src"));
    assert.match(img, /https:\/\/tuybpizjeszgwtcvunmp\.supabase\.co/);
    assert.match(connect, /https:\/\/tuybpizjeszgwtcvunmp\.supabase\.co/);
  });

  it("no depende de Vercel Blob", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
    assert.equal(pkg.dependencies["@vercel/blob"], undefined);
    const env = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
    assert.doesNotMatch(env, /BLOB_READ_WRITE_TOKEN/);
    assert.match(env, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(env, /VITE_SUPABASE_URL/);
  });
});
