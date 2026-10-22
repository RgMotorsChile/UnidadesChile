/** Rutas reales que atiende la única función de Vercel. */
export const API_ROUTES = new Set([
  "catalog-index",
  "consigna",
  "contacto",
  "html",
  "img",
  "og-image",
  "sheet-plates",
  "sitemap",
  "admin/login",
  "admin/logout",
  "admin/photos",
  "admin/sell",
  "admin/sync",
  "admin/vehicles",
]);

function parseUrl(rawUrl) {
  const raw = String(rawUrl || "/");
  return raw.startsWith("http://") || raw.startsWith("https://") ? new URL(raw) : new URL(raw, "http://local");
}

/** Clave /api/... que ve el único router de Vercel. */
export function apiRouteKey(rawUrl) {
  return parseUrl(rawUrl).pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
}

/**
 * El catch-all recibe la URL original del navegador. Un rewrite a
 * /api/html?path=:path llega como /catalogo, no como /api/html.
 * Las páginas del sitio caen en html; una /api desconocida sigue en 404.
 */
export function resolveHandlerKey(rawUrl) {
  const pathname = parseUrl(rawUrl).pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/sitemap.xml") return "sitemap";
  const key = pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  if (API_ROUTES.has(key)) return key;
  if (pathname === "/api" || pathname.startsWith("/api/")) return "";
  return "html";
}
