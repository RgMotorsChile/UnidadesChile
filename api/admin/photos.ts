import { deny, isAdminRequest } from "./_auth.js";
import { dbReader, supabaseAdmin, tenantId } from "./_db.js";
import { deleteBlobUrls, isBlobReady, storeMediaFile } from "./_media.js";
import {
  driveFileId,
  mediaUrlsEqual,
  normalizeMediaUrl,
  orderGalleryWithCover,
} from "./_cover.js";

export const config = {
  runtime: "nodejs",
  api: { bodyParser: { sizeLimit: "4mb" } },
};

function slugOk(slug: string) {
  return Boolean(slug && /^[a-z0-9-]+$/i.test(slug));
}

function guessMime(name: string, type?: string) {
  if (type && /^image\//i.test(type)) return type;
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  return "image/jpeg";
}

function decodeDataUrl(raw: string) {
  const m = String(raw || "").match(/^data:([^;]+);base64,(.+)$/);
  if (m) return { mime: m[1], bytes: Buffer.from(m[2], "base64") };
  return { mime: "image/jpeg", bytes: Buffer.from(String(raw || ""), "base64") };
}

async function loadVehicle(slug: string) {
  const sb = dbReader();
  if (!sb) return { error: "Supabase no configurado.", row: null, tenant: null, sb: null };
  const tenant = await tenantId(sb);
  if (!tenant) return { error: "Tenant no encontrado.", row: null, tenant: null, sb };
  const { data, error } = await sb
    .from("catalog_vehicles")
    .select("*")
    .eq("tenant_id", tenant)
    .eq("slug", slug)
    .maybeSingle();
  if (error) return { error: error.message, row: null, tenant, sb };
  return { error: data ? "" : "Vehículo no encontrado.", row: data, tenant, sb };
}

function galleryOf(row: Record<string, unknown>) {
  const gallery = Array.isArray(row.gallery) ? (row.gallery as string[]).filter(Boolean) : [];
  const image = String(row.image || "");
  return orderGalleryWithCover(image, gallery.length ? gallery : image ? [image] : []);
}

async function saveGallery(
  slug: string,
  tenant: string,
  image: string,
  gallery: string[],
) {
  const writer = supabaseAdmin();
  if (!writer) return "Falta SUPABASE_SERVICE_ROLE_KEY para guardar la portada.";
  const ordered = orderGalleryWithCover(image, gallery);
  const { error } = await writer
    .from("catalog_vehicles")
    .update({
      image: ordered[0] || image,
      gallery: ordered,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenant)
    .eq("slug", slug);
  return error ? error.message : "";
}

export default async function handler(
  req: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: { cookie?: string };
    query?: { slug?: string };
  },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  const method = req.method || "GET";
  if (method !== "GET" && !isAdminRequest(req)) return deny(res);

  try {
    if (method === "GET") {
      const fromUrl = String((req as { url?: string }).url || "");
      const querySlug = fromUrl.includes("?")
        ? new URL(fromUrl, "http://localhost").searchParams.get("slug")
        : "";
      const slug = String(req.query?.slug || querySlug || "").trim();
      if (!slugOk(slug)) return res.status(400).json({ ok: false, error: "Slug inválido." });
      const loaded = await loadVehicle(slug);
      if (loaded.error || !loaded.row) {
        return res.status(loaded.row ? 500 : 404).json({ ok: false, error: loaded.error });
      }
      const cover = normalizeMediaUrl(String(loaded.row.image || ""));
      const urls = galleryOf(loaded.row as Record<string, unknown>);
      const seen = new Set<string>();
      const gallery = urls
        .map((url) => normalizeMediaUrl(url))
        .filter((url) => {
          const key = driveFileId(url) || url;
          if (!url || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((url) => ({
          name: url.split("/").pop()?.split("?")[0] || url,
          url,
          size: 0,
          isCover: Boolean(cover && mediaUrlsEqual(cover, url)),
        }));
      if (cover && !gallery.some((g) => mediaUrlsEqual(g.url, cover))) {
        gallery.unshift({
          name: cover.split("/").pop()?.split("?")[0] || cover,
          url: cover,
          size: 0,
          isCover: true,
        });
      }
      gallery.sort((a, b) => Number(Boolean(b.isCover)) - Number(Boolean(a.isCover)));
      return res.status(200).json({
        ok: true,
        slug,
        gallery,
        coverImage: gallery[0]?.url || cover,
        storage: isBlobReady() ? "blob" : "none",
      });
    }

    const body = req.body || {};
    const slug = String(body.slug || req.query?.slug || "").trim();
    if (!slugOk(slug)) return res.status(400).json({ ok: false, error: "Slug inválido." });
    const loaded = await loadVehicle(slug);
    if (loaded.error || !loaded.row || !loaded.tenant) {
      return res.status(404).json({ ok: false, error: loaded.error || "Vehículo no encontrado." });
    }

    if (method === "PUT") {
      const action = String(body.action || "");
      const current = galleryOf(loaded.row as Record<string, unknown>);
      if (action === "set_cover") {
        const coverUrl = normalizeMediaUrl(String(body.coverUrl || ""));
        if (!coverUrl) return res.status(400).json({ ok: false, error: "Falta coverUrl." });
        const next = orderGalleryWithCover(coverUrl, current);
        const err = await saveGallery(slug, loaded.tenant, next[0] || coverUrl, next);
        if (err) return res.status(503).json({ ok: false, error: err });
        return res.status(200).json({ ok: true, success: true, coverImage: next[0], gallery: next });
      }
      if (action === "reorder" && Array.isArray(body.gallery)) {
        const next = (body.gallery as unknown[]).map((u) => normalizeMediaUrl(String(u)));
        const err = await saveGallery(slug, loaded.tenant, next[0] || "", next);
        if (err) return res.status(503).json({ ok: false, error: err });
        return res.status(200).json({ ok: true, success: true, gallery: next, coverImage: next[0] || "" });
      }
      return res.status(400).json({ ok: false, error: "Acción no reconocida." });
    }

    if (method === "DELETE") {
      const urlHint = normalizeMediaUrl(String(body.url || ""));
      const filename = String(body.filename || "");
      const current = galleryOf(loaded.row as Record<string, unknown>);
      const next = current.filter((u) => {
        if (urlHint && mediaUrlsEqual(u, urlHint)) return false;
        if (filename && u.includes(filename)) return false;
        return true;
      });
      if (urlHint) await deleteBlobUrls([urlHint]);
      const err = await saveGallery(slug, loaded.tenant, next[0] || "", next);
      if (err) return res.status(503).json({ ok: false, error: err });
      return res.status(200).json({ ok: true, success: true, gallery: next });
    }

    if (method === "POST") {
      if (!isBlobReady()) {
        return res.status(503).json({
          ok: false,
          error: "Falta BLOB_READ_WRITE_TOKEN para subir fotos nuevas. Puedes elegir portada sobre las ya publicadas.",
        });
      }
      const files = Array.isArray(body.files) ? (body.files as { name?: string; type?: string; data?: string }[]) : [];
      if (!files.length) return res.status(400).json({ ok: false, error: "No se enviaron archivos." });
      const type = String(body.type || "gallery");
      const current = galleryOf(loaded.row as Record<string, unknown>);
      const newUrls: string[] = [];
      for (const file of files) {
        const name = String(file.name || "photo.jpg");
        const { bytes, mime } = decodeDataUrl(String(file.data || ""));
        if (!bytes.length) continue;
        const base =
          name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 30) || "photo";
        const ext = /\.png$/i.test(name) ? "png" : /\.webp$/i.test(name) ? "webp" : "jpg";
        const prefix = type === "cover" && newUrls.length === 0 ? "cover_" : "";
        const stored = await storeMediaFile({
          bytes,
          relativePath: `cars/uploads/${slug}/${prefix}${Date.now()}_${base}.${ext}`,
          contentType: guessMime(name, file.type || mime),
        });
        newUrls.push(stored.url);
      }
      if (!newUrls.length) return res.status(400).json({ ok: false, error: "No se pudo leer ninguna foto." });
      const next =
        type === "cover"
          ? orderGalleryWithCover(newUrls[0] || "", [...newUrls, ...current])
          : [...current, ...newUrls];
      const err = await saveGallery(slug, loaded.tenant, next[0] || "", next);
      if (err) return res.status(503).json({ ok: false, error: err, urls: newUrls });
      return res.status(200).json({ ok: true, success: true, count: newUrls.length, urls: newUrls });
    }

    return res.status(405).json({ ok: false, error: "Método no permitido." });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Error de fotos.",
    });
  }
}
