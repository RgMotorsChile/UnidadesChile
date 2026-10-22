import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleImage, handleOg } from "./server/images.mjs";
import { decide, getCatalog, getSheetPlates, goneDocument, renderHtml } from "./server/seoGate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

function htmlFile() {
  const dist = path.join(root, "dist/index.html");
  try {
    return readFileSync(dist, "utf8");
  } catch {
    return readFileSync(path.join(root, "index.html"), "utf8");
  }
}

function requestUrl(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url || "/", `http://${host}`);
}

async function publication() {
  const [catalog, sheetPlates] = await Promise.all([getCatalog(), getSheetPlates()]);
  return { catalog, sheetPlates };
}

async function handle(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const url = requestUrl(req);
  if (url.pathname === "/api/img") return handleImage(req, res);
  if (url.pathname === "/api/catalog-index") {
    const { catalog } = await publication();
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(catalog));
    return;
  }
  if (url.pathname === "/api/og-image") {
    const { catalog } = await publication();
    return handleOg(req, res, catalog);
  }
  const { catalog, sheetPlates } = await publication();
  if (url.pathname === "/sitemap.xml" || url.pathname === "/api/sitemap") {
    const decision = decide(new URL("/sitemap.xml", url.origin), catalog, sheetPlates);
    res.setHeader("content-type", "application/xml; charset=utf-8");
    res.end(decision.body);
    return;
  }
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  if (pathname.includes(".") && pathname !== "/sitemap.xml") return next();
  const decision = decide(url, catalog, sheetPlates);
  if (decision.type === "redirect") {
    res.statusCode = decision.status;
    res.setHeader("Location", decision.to);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.end();
    return;
  }
  if (decision.type === "gone") {
    res.statusCode = 410;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.setHeader("x-robots-tag", "noindex");
    res.end(goneDocument(decision.origin));
    return;
  }
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=0, must-revalidate");
  res.end(renderHtml(htmlFile(), decision.seo));
}

export function seoPreviewPlugin() {
  return {
    name: "uc-seo-preview",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handle(req, res, next).catch(next);
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = requestUrl(req);
        const path = url.pathname.replace(/\/+$/, "") || "/";
        const api = path.startsWith("/api/") || path === "/sitemap.xml";
        const vehicle = /^\/(?:catalogo|inventario)\//.test(path);
        if (!api && !vehicle) return next();
        if (!vehicle) {
          handle(req, res, next).catch(next);
          return;
        }
        getCatalog()
          .then(async (catalog) => {
            const sheetPlates = await getSheetPlates();
            const decision = decide(url, catalog, sheetPlates);
            if (decision.type === "html") return next();
            return handle(req, res, next);
          })
          .catch(next);
      });
    },
  };
}
