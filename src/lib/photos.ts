/** Aviso cuando Drive aún no bajó fotos de esa patente. */
export const PENDING_PHOTO = "/images/placeholder-pending-car.svg";

export function isPendingPhoto(src?: string) {
  if (!src) return true;
  return /placeholder-pending|fotos-en-proceso/i.test(src);
}

export function isRemotePhoto(src?: string) {
  if (!src || isPendingPhoto(src)) return false;
  if (src.startsWith("idb:")) return true;
  return /blob\.vercel-storage\.com|lh3\.googleusercontent\.com/i.test(src);
}

export function hasRemotePhotos(imagenes?: string[]) {
  return (imagenes || []).some(isRemotePhoto);
}

export function coverSrc(imagenes: string[] | undefined) {
  const first = (imagenes || []).find((src) => src && !isPendingPhoto(src) && !src.startsWith("idb:"));
  if (first) return first;
  const local = (imagenes || []).find((src) => src && !isPendingPhoto(src));
  return local || PENDING_PHOTO;
}
