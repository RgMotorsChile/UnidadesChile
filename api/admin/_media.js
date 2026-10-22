import { createHash } from "node:crypto";
import { SUPABASE_URL, UC_TENANT, supabaseAdmin } from "./_db.js";

/** Bucket compartido con RgMotorsChileWeb. Paths: <tenant>/<slug>/<sha256>.<ext> */
export const VEHICLE_PHOTOS_BUCKET = "vehicle-photos";

/**
 * Fallos de borrado inmediato. El job de huérfanos de RgMotorsChileWeb
 * lee esta tabla (ver supabase/migrations/20261022120000_vehicle_photo_orphans.sql).
 * No hay gracia: el objeto se borra al confirmar la base; la fila solo existe
 * si ese borrado falló.
 */
export const ORPHAN_TABLE = "vehicle_photo_orphans";

export const ORPHAN_REASONS = ["sold", "deleted", "removed", "replaced"];

const REASON_SET = new Set(ORPHAN_REASONS);

export function isStorageReady() {
  return Boolean(supabaseAdmin());
}

export function safeSlug(slug) {
  const value = String(slug || "").trim();
  if (!/^[a-z0-9-]+$/i.test(value)) return "";
  return value;
}

export function vehiclePrefix(slug) {
  const safe = safeSlug(slug);
  return safe ? `${UC_TENANT}/${safe}/` : "";
}

export function extensionFor(contentType) {
  const ct = String(contentType || "").toLowerCase();
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("avif")) return "avif";
  return "jpg";
}

export function slugFromRelativePath(relativePath) {
  const parts = String(relativePath || "")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);
  const uploads = parts.indexOf("uploads");
  if (uploads >= 0) return parts[uploads + 1] || "";
  if (parts[0] === UC_TENANT) return parts[1] || "";
  return "";
}

export function buildObjectPath({ bytes, slug, contentType }) {
  const safe = safeSlug(slug);
  if (!safe) throw new Error("Slug inválido para guardar la foto.");
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
  if (!buf.length) throw new Error("La foto está vacía.");
  const hash = createHash("sha256").update(buf).digest("hex");
  return `${UC_TENANT}/${safe}/${hash}.${extensionFor(contentType)}`;
}

export function publicObjectUrl(objectPath) {
  const base = String(SUPABASE_URL || "").replace(/\/$/, "");
  const path = String(objectPath || "").replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${VEHICLE_PHOTOS_BUCKET}/${path}`;
}

export function objectPathFromPublicUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) pathname = new URL(raw).pathname;
  } catch {
    pathname = raw.split("?")[0];
  }
  const markers = [
    `/storage/v1/object/public/${VEHICLE_PHOTOS_BUCKET}/`,
    `/storage/v1/object/sign/${VEHICLE_PHOTOS_BUCKET}/`,
    `/storage/v1/object/authenticated/${VEHICLE_PHOTOS_BUCKET}/`,
  ];
  for (const marker of markers) {
    const at = pathname.indexOf(marker);
    if (at < 0) continue;
    try {
      return decodeURIComponent(pathname.slice(at + marker.length)).replace(/^\/+/, "");
    } catch {
      return pathname.slice(at + marker.length).replace(/^\/+/, "");
    }
  }
  return "";
}

export function photoUrlsOf(row) {
  if (!row) return [];
  const urls = [];
  if (row.image) urls.push(String(row.image));
  const gallery = Array.isArray(row.gallery) ? row.gallery : Array.isArray(row.imagenes) ? row.imagenes : [];
  for (const url of gallery) {
    if (url) urls.push(String(url));
  }
  return urls;
}

/** Paths de este auto que estaban antes y ya no están en la ficha guardada. */
export function droppedStoragePaths(beforeUrls, afterUrls, slug) {
  const prefix = vehiclePrefix(slug);
  if (!prefix) return [];
  const kept = new Set();
  for (const url of afterUrls || []) {
    const path = objectPathFromPublicUrl(url);
    if (path && path.startsWith(prefix)) kept.add(path);
  }
  const dropped = [];
  const seen = new Set();
  for (const url of beforeUrls || []) {
    const path = objectPathFromPublicUrl(url);
    if (!path || !path.startsWith(prefix) || kept.has(path) || seen.has(path)) continue;
    seen.add(path);
    dropped.push(path);
  }
  return dropped;
}

/** `replaced` si entró otra foto de Storage de este auto; si no, `removed`. */
export function dropReason(beforeUrls, afterUrls, slug) {
  const prefix = vehiclePrefix(slug);
  if (!prefix) return "removed";
  const before = new Set();
  for (const url of beforeUrls || []) {
    const path = objectPathFromPublicUrl(url);
    if (path && path.startsWith(prefix)) before.add(path);
  }
  for (const url of afterUrls || []) {
    const path = objectPathFromPublicUrl(url);
    if (path && path.startsWith(prefix) && !before.has(path)) return "replaced";
  }
  return "removed";
}

/** Carpetas de boletas, pagos u otros módulos. No se listan ni se borran. */
export function isProtectedStoragePath(path) {
  const parts = String(path || "")
    .split("/")
    .filter(Boolean);
  return parts.some((part) => /^(boletas?|boletas-receipts|payments?|pagos|receipts?)$/i.test(part));
}

/**
 * Frames del tour 360. `count` es el tope de fotos del giro, no un bucket.
 * El patrón vive en vehicle-photos: unidades-chile/<slug>/spin/<version>/<set>/{i}.webp
 */
export function expandSpinPatterns(spin) {
  let value = spin;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!value || typeof value !== "object") return [];
  const count = Math.min(Math.max(Number(value.count) || 0, 0), 360);
  const urls = [];
  for (const pattern of [value.pattern, value.hiPattern]) {
    if (!pattern) continue;
    const raw = String(pattern);
    if (!raw.includes("{i}") && !raw.includes("{index}")) {
      urls.push(raw);
      continue;
    }
    if (!count) continue;
    for (let i = 1; i <= count; i += 1) {
      const frame = String(i).padStart(3, "0");
      urls.push(raw.replaceAll("{index}", frame).replaceAll("{i}", frame));
    }
  }
  return urls;
}

function isAlreadyGone(error) {
  const message = String(error?.message || error || "");
  const status = String(error?.statusCode || error?.status || "");
  return status === "404" || /not found|does not exist|no such/i.test(message);
}

export async function listSlugObjectPaths(admin, slug) {
  const root = vehiclePrefix(slug).replace(/\/$/, "");
  if (!root || !admin) return [];
  const paths = [];
  const seen = new Set();
  async function walk(prefix) {
    if (!prefix.startsWith(root) || seen.has(prefix) || seen.size > 80) return;
    seen.add(prefix);
    const page = 1000;
    for (let offset = 0; offset < 20000; offset += page) {
      const { data, error } = await admin.storage.from(VEHICLE_PHOTOS_BUCKET).list(prefix, {
        limit: page,
        offset,
      });
      if (error) throw new Error(error.message || "No se pudo listar las fotos.");
      const rows = data || [];
      for (const item of rows) {
        if (!item?.name || item.name === ".emptyFolderPlaceholder") continue;
        if (item.name.includes("..") || item.name.includes("/")) continue;
        const path = `${prefix}/${item.name}`;
        if (isProtectedStoragePath(path)) continue;
        if (!item.id) {
          await walk(path);
          continue;
        }
        paths.push(path);
      }
      if (rows.length < page) break;
    }
  }
  await walk(root);
  return paths;
}

async function removePaths(admin, paths) {
  const deleted = [];
  const failed = [];
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    const { error } = await admin.storage.from(VEHICLE_PHOTOS_BUCKET).remove(chunk);
    if (!error) {
      deleted.push(...chunk);
      continue;
    }
    for (const path of chunk) {
      const one = await admin.storage.from(VEHICLE_PHOTOS_BUCKET).remove([path]);
      if (!one.error || isAlreadyGone(one.error)) deleted.push(path);
      else failed.push({ path, error: one.error.message || "No se pudo borrar la foto." });
    }
  }
  return { deleted, failed };
}

async function recordOrphans(admin, failures, slug, reason) {
  if (!failures.length) return { orphans: 0, orphanError: "" };
  if (!admin) {
    console.error("[media] sin cliente para registrar huérfanos", failures.map((f) => f.path));
    return { orphans: 0, orphanError: "Falta SUPABASE_SERVICE_ROLE_KEY." };
  }
  const rows = failures.map((failure) => ({
    bucket: VEHICLE_PHOTOS_BUCKET,
    object_path: failure.path,
    tenant_slug: UC_TENANT,
    vehicle_slug: safeSlug(slug) || "",
    public_url: failure.path.endsWith("/") ? "" : publicObjectUrl(failure.path),
    reason: REASON_SET.has(reason) ? reason : "removed",
    error: String(failure.error || "").slice(0, 500),
    purged_at: null,
  }));
  const { error } = await admin.from(ORPHAN_TABLE).upsert(rows, { onConflict: "bucket,object_path" });
  if (error) {
    const orphanError = error.message || "No se pudo registrar el huérfano.";
    console.error("[media] huérfanos sin registrar", orphanError, rows.map((row) => row.object_path));
    return { orphans: 0, orphanError };
  }
  return { orphans: rows.length, orphanError: "" };
}

/**
 * Borra objetos de Storage después de confirmar el cambio en la base.
 * No lanza: si el borrado falla, deja la fila en vehicle_photo_orphans.
 * `listSlug` vacía unidades-chile/<slug>/, incluidas las carpetas spin/ del tour 360.
 * No lista ni borra boletas ni pagos.
 */
export async function deleteStoredPhotos(
  { paths = [], slug = "", reason = "removed", listSlug = false } = {},
  deps = {},
) {
  try {
    const admin = deps.admin || supabaseAdmin();
    const prefix = vehiclePrefix(slug);
    const wanted = new Set();
    for (const path of paths) {
      const normalized = String(path || "").replace(/^\/+/, "");
      if (!prefix || !normalized.startsWith(prefix) || isProtectedStoragePath(normalized)) continue;
      wanted.add(normalized);
    }
    const failures = [];
    if (listSlug && prefix) {
      if (!admin) {
        failures.push({ path: prefix, error: "Falta SUPABASE_SERVICE_ROLE_KEY." });
      } else {
        try {
          for (const path of await listSlugObjectPaths(admin, slug)) wanted.add(path);
        } catch (err) {
          failures.push({
            path: prefix,
            error: err instanceof Error ? err.message : "No se pudo listar las fotos.",
          });
        }
      }
    }
    let deleted = [];
    if (!admin) {
      for (const path of wanted) failures.push({ path, error: "Falta SUPABASE_SERVICE_ROLE_KEY." });
    } else if (wanted.size) {
      const result = await removePaths(admin, [...wanted]);
      deleted = result.deleted;
      failures.push(...result.failed);
    }
    const recorded = await recordOrphans(admin, failures, slug, reason);
    return { deleted: deleted.length, orphans: recorded.orphans, orphanError: recorded.orphanError };
  } catch (err) {
    const orphanError = err instanceof Error ? err.message : "No se pudieron borrar las fotos.";
    console.error("[media] borrado inesperado", orphanError);
    return { deleted: 0, orphans: 0, orphanError };
  }
}

export async function storeMediaFile({ bytes, relativePath, slug, contentType }, deps = {}) {
  const admin = deps.admin || supabaseAdmin();
  if (!admin) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para subir fotos en producción.");
  }
  const resolved = safeSlug(slug) || safeSlug(slugFromRelativePath(relativePath));
  const path = buildObjectPath({ bytes, slug: resolved, contentType });
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
  const { error } = await admin.storage.from(VEHICLE_PHOTOS_BUCKET).upload(path, buf, {
    contentType: contentType || "image/jpeg",
    upsert: true,
    cacheControl: "31536000",
  });
  if (error && !/already exists/i.test(String(error.message || ""))) {
    throw new Error(error.message || "No se pudo subir la foto a Supabase Storage.");
  }
  return {
    url: publicObjectUrl(path),
    relativePath: `/${path}`,
    storage: "supabase",
    path,
  };
}
