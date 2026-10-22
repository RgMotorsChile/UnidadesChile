export const WIDTHS = [480, 768, 1200];

const SUPABASE_HOSTS = new Set(["tuybpizjeszgwtcvunmp.supabase.co"]);

export function isPendingSrc(src) {
  if (!src) return true;
  return /placeholder-pending|fotos-en-proceso/i.test(String(src));
}

export function isAllowedImageSrc(src) {
  if (!src || isPendingSrc(src)) return false;
  if (src.startsWith("/") && !src.startsWith("//") && !src.includes("..")) {
    return /^\/(cars|images|logos)\//.test(src) || src === "/og-image.png";
  }
  try {
    const url = new URL(src);
    if (!SUPABASE_HOSTS.has(url.hostname)) return false;
    return url.pathname.startsWith("/storage/v1/object/public/vehicle-photos/");
  } catch {
    return false;
  }
}

export function imageUrl(src, width, format) {
  if (!isAllowedImageSrc(src)) return "";
  const w = WIDTHS.includes(width) ? width : 768;
  const fmt = format === "avif" || format === "webp" ? format : "webp";
  if (/\/storage\/v1\/object\/public\//.test(src)) {
    const render = src.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const q = `width=${w}&quality=45&format=${fmt}&resize=contain`;
    return `${render}${render.includes("?") ? "&" : "?"}${q}`;
  }
  return `/api/img?src=${encodeURIComponent(src)}&w=${w}&f=${fmt}`;
}

export function srcSet(src, format) {
  return WIDTHS.map((w) => `${imageUrl(src, w, format)} ${w}w`).join(", ");
}

export const IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1280px) 46vw, 380px";
