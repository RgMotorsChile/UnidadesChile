import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { isAllowedImageSrc, WIDTHS } from "../shared/images.mjs";
import { coverOf } from "../shared/vehiclePublic.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = [path.join(root, "public"), path.join(root, "dist")];
const transformed = new Map();

async function remember(key, produce) {
  const hit = transformed.get(key);
  if (hit) return hit;
  const pending = produce();
  transformed.set(key, pending);
  try {
    return await pending;
  } catch (error) {
    transformed.delete(key);
    throw error;
  } finally {
    if (transformed.size > 240) {
      const oldest = transformed.keys().next().value;
      transformed.delete(oldest);
    }
  }
}

function requestUrl(req) {
  const raw = req.url || "/";
  return new URL(raw, "http://localhost");
}

async function readLocal(src) {
  const rel = src.replace(/^\/+/, "");
  if (!rel || rel.includes("..")) return null;
  for (const base of roots) {
    const full = path.resolve(base, rel);
    if (!full.startsWith(base + path.sep) && full !== base) continue;
    try {
      await access(full);
      return readFile(full);
    } catch {
      /* siguiente raíz */
    }
  }
  return null;
}

async function readRemote(src) {
  const res = await fetch(src, { redirect: "error" });
  if (!res.ok) return null;
  const len = Number(res.headers.get("content-length") || 0);
  if (len > 15_000_000) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 15_000_000) return null;
  return buf;
}

export async function loadImage(src) {
  if (!isAllowedImageSrc(src)) return null;
  if (src.startsWith("/")) return readLocal(src);
  return readRemote(src);
}

function send(res, status, body, headers) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(body);
}

export async function handleImage(req, res) {
  const url = requestUrl(req);
  const src = url.searchParams.get("src") || "";
  const width = Number(url.searchParams.get("w") || 768);
  const format = url.searchParams.get("f") === "avif" ? "avif" : "webp";
  if (!WIDTHS.includes(width) || !isAllowedImageSrc(src)) {
    return send(res, 400, "imagen no permitida", { "content-type": "text/plain" });
  }
  const out = await remember(`${format}:${width}:${src}`, async () => {
    const input = await loadImage(src);
    if (!input) return null;
    let pipeline = sharp(input, { failOn: "none" }).rotate().resize({
      width,
      fit: "inside",
      withoutEnlargement: true,
    });
    pipeline = format === "avif" ? pipeline.avif({ quality: 45 }) : pipeline.webp({ quality: 62 });
    return pipeline.toBuffer();
  });
  if (!out) return send(res, 404, "no encontrada", { "content-type": "text/plain" });
  return send(res, 200, out, {
    "content-type": format === "avif" ? "image/avif" : "image/webp",
    "cache-control": "public, max-age=31536000, immutable",
    "cdn-cache-control": "public, max-age=31536000",
    vary: "Accept",
  });
}

async function jpegUnder300kb(input) {
  let quality = 60;
  let out = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
  while (out.length > 300 * 1024 && quality > 28) {
    quality -= 8;
    out = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(1200, 630, { fit: "cover", position: "centre" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
  return out;
}

export async function handleOg(req, res, catalog) {
  const url = requestUrl(req);
  const slug = url.searchParams.get("slug") || "";
  const car = (catalog || []).find((row) => row.publicSlug === slug || row.id === slug);
  const cover = car ? coverOf(car) : "";
  if (!car || !isAllowedImageSrc(cover)) {
    return send(res, 404, "sin foto", { "content-type": "text/plain", "x-robots-tag": "noindex" });
  }
  const out = await remember(`og:${cover}`, async () => {
    const input = await loadImage(cover);
    if (!input) return null;
    return jpegUnder300kb(input);
  });
  if (!out) return send(res, 404, "sin foto", { "content-type": "text/plain" });
  return send(res, 200, out, {
    "content-type": "image/jpeg",
    "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    "cdn-cache-control": "public, s-maxage=86400",
    "x-content-type-options": "nosniff",
  });
}
