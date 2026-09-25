export function driveFileId(url) {
  const m = String(url || "").match(/[?&]id=([^&]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export function normalizeMediaUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  if (/drive\.google\.com/i.test(raw)) {
    const id = driveFileId(raw);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    return raw;
  }
  return raw.split("?")[0];
}

export function mediaUrlsEqual(a, b) {
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

export function orderGalleryWithCover(cover, gallery) {
  const list = (gallery || []).filter(Boolean);
  if (!cover) return list;
  const rest = list.filter((g) => !mediaUrlsEqual(g, cover));
  const coverInGallery = list.find((g) => mediaUrlsEqual(g, cover));
  return [coverInGallery || normalizeMediaUrl(cover), ...rest];
}
