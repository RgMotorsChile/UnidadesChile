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
  const real = (imagenes || []).find((src) => isRemotePhoto(src) || (src && !isPendingPhoto(src)));
  return real || PENDING_PHOTO;
}
