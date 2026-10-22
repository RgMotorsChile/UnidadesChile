/** Clave /api/... que ve el único router de Vercel. */
export function apiRouteKey(rawUrl) {
  const raw = String(rawUrl || "/");
  const url = raw.startsWith("http://") || raw.startsWith("https://") ? new URL(raw) : new URL(raw, "http://local");
  return url.pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
}
