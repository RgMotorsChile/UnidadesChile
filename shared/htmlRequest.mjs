/** Recupera la URL pública cuando Vercel reescribe la página a /api/html. */
export function urlFromHtmlFunction(rawUrl, host, proto = "https") {
  const safeHost = String(host || "www.unidadeschile.cl").split(",")[0].trim();
  const safeProto = String(proto || "https").split(",")[0].trim() || "https";
  const url = new URL(rawUrl || "/", `${safeProto}://${safeHost}`);
  if (url.pathname === "/api/html") {
    const path = url.searchParams.get("path");
    url.searchParams.delete("path");
    url.pathname = path ? `/${String(path).replace(/^\/+/, "")}` : "/";
  }
  return url;
}
