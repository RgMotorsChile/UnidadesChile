/** Portada: la elige el admin. Drive debe conservar `?id=`. */

export function driveFileId(url: string): string | null {
  const m = String(url || "").match(/[?&]id=([^&]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export function normalizeMediaUrl(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  if (/drive\.google\.com/i.test(raw)) {
    const id = driveFileId(raw);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    return raw;
  }
  return raw.split("?")[0];
}

export function mediaUrlsEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const na = normalizeMediaUrl(a);
  const nb = normalizeMediaUrl(b);
  if (na === nb) return true;
  const idA = driveFileId(na);
  const idB = driveFileId(nb);
  if (idA && idB) return idA === idB;
  return na.split("?")[0] === nb.split("?")[0];
}

export function orderGalleryWithCover(cover: string, gallery: string[]): string[] {
  if (!cover) return gallery.filter(Boolean);
  const rest = gallery.filter((g) => g && !mediaUrlsEqual(g, cover));
  const coverInGallery = gallery.find((g) => mediaUrlsEqual(g, cover));
  return [coverInGallery || normalizeMediaUrl(cover), ...rest];
}
