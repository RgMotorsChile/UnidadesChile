import { applyHead, goneHtml } from "./htmlHead.mjs";
import { IMAGE_SIZES, imageUrl, srcSet } from "./images.mjs";
import { coverOf, isListedHere, pageSeo, publicOrigin, resolveVehicle, sitemapXml } from "./vehiclePublic.mjs";

function preloadFor(car) {
  const cover = car ? coverOf(car) : "";
  const href = cover ? imageUrl(cover, 768, "avif") : "";
  if (!href) return null;
  return { href, srcSet: srcSet(cover, "avif"), sizes: IMAGE_SIZES };
}

function leadCar(catalog) {
  const rows = (catalog || []).filter(
    (car) =>
      (car.sucursal || "unidades-chile") === "unidades-chile" &&
      (car.status || "publicado") === "publicado" &&
      isListedHere(car) &&
      coverOf(car),
  );
  rows.sort(
    (a, b) =>
      Number(b.mercado || 0) -
      Number(b.precio || 0) -
      (Number(a.mercado || 0) - Number(a.precio || 0)),
  );
  return rows[0] || null;
}

export function decide(url, catalog) {
  const origin = publicOrigin(url.host, url.origin);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/sitemap.xml") {
    return { type: "sitemap", body: sitemapXml(origin, catalog), origin };
  }
  if (pathname === "/inventario") {
    return { type: "redirect", status: 301, to: `${origin}/catalogo` };
  }

  const vehicle = pathname.match(/^\/(?:catalogo|inventario)\/([^/]+)$/);
  if (vehicle) {
    const decision = resolveVehicle(vehicle[1], catalog);
    if (decision.type === "redirect") {
      const to = decision.to.startsWith("http") ? decision.to : `${origin}${decision.to}`;
      return { type: "redirect", status: decision.status, to };
    }
    if (decision.type === "gone") return { type: "gone", origin };
    if (decision.type === "ok") {
      if (pathname.startsWith("/inventario/")) {
        return { type: "redirect", status: 301, to: `${origin}/catalogo/${decision.car.publicSlug}` };
      }
      const seo = pageSeo(origin, pathname, decision.car);
      const preload = preloadFor(decision.car);
      if (preload) seo.preload = preload;
      return { type: "html", seo, origin };
    }
    const missing = pageSeo(origin, pathname);
    missing.title = "Unidad no encontrada | Unidades Chile";
    missing.robots = "noindex";
    return { type: "html", seo: missing, origin };
  }

  const seo = pageSeo(origin, pathname);
  if (pathname === "/catalogo") {
    const preload = preloadFor(leadCar(catalog));
    if (preload) seo.preload = preload;
  }
  return { type: "html", seo, origin };
}

export function renderHtml(template, seo) {
  return applyHead(template, seo);
}

export function goneDocument(origin) {
  return goneHtml(origin);
}
