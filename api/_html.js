import { decide, goneDocument, renderHtml } from "../shared/dispatch.mjs";
import { urlFromHtmlFunction } from "../shared/htmlRequest.mjs";
import { getCatalog, getSheetPlates } from "../server/seoGate.mjs";

export const config = { runtime: "nodejs" };

function requestUrl(req) {
  const host = req.headers?.["x-forwarded-host"] || req.headers?.host;
  const proto = req.headers?.["x-forwarded-proto"] || "https";
  return urlFromHtmlFunction(req.url, host, proto);
}

export default async function handler(req, res) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("allow", "GET, HEAD");
    res.end("method");
    return;
  }

  const url = requestUrl(req);
  const [catalog, sheetPlates] = await Promise.all([getCatalog(), getSheetPlates()]);
  const decision = decide(url, catalog, sheetPlates);

  if (decision.type === "redirect") {
    res.statusCode = decision.status;
    res.setHeader("Location", decision.to);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.end();
    return;
  }
  if (decision.type === "sitemap") {
    res.statusCode = 200;
    res.setHeader("content-type", "application/xml; charset=utf-8");
    res.setHeader("cache-control", "public, max-age=300, must-revalidate");
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(decision.body);
    return;
  }
  if (decision.type === "gone") {
    res.statusCode = 410;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.setHeader("x-robots-tag", "noindex");
    res.setHeader("cache-control", "public, max-age=300");
    res.end(goneDocument(decision.origin));
    return;
  }

  const indexRes = await fetch(new URL("/index.html", url.origin));
  if (!indexRes.ok) {
    res.statusCode = 502;
    res.end("html");
    return;
  }
  const html = renderHtml(await indexRes.text(), decision.seo);
  res.statusCode = 200;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=0, must-revalidate");
  res.setHeader("cdn-cache-control", "public, s-maxage=120, stale-while-revalidate=600");
  res.setHeader("x-robots-tag", decision.seo?.robots || "index, follow");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(html);
}
