/** Aviso cuando Drive aún no bajó fotos de esa patente. */
export const PENDING_PHOTO = "/images/placeholder-pending-car.svg";

export function isPendingPhoto(src?: string) {
  if (!src) return true;
  return /placeholder-pending|fotos-en-proceso/i.test(src);
}

export function coverSrc(imagenes: string[] | undefined) {
  const real = (imagenes || []).find((src) => src && !isPendingPhoto(src));
  return real || PENDING_PHOTO;
}
