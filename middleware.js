import { fetchRemoteCatalog } from "./shared/catalog.mjs";
import { decide, goneDocument, renderHtml } from "./shared/dispatch.mjs";

export const config = {
  matcher: ["/((?!api/|assets/|images/|cars/|logos/|favicon|.*\\..*).*)"],
};

let memory = null;

async function catalogFor(request) {
  if (memory && Date.now() - memory.at < 60_000) return memory.rows;
  try {
    const remote = await fetchRemoteCatalog(process.env);
    if (remote && remote.length) {
      memory = { at: Date.now(), rows: remote };
      return remote;
    }
  } catch {
    /* la función de índice responde con el seed */
  }
  try {
    const res = await fetch(new URL("/api/catalog-index", request.url));
    if (res.ok) {
      const rows = await res.json();
      memory = { at: Date.now(), rows };
      return rows;
    }
  } catch {
    /* sin índice */
  }
  memory = { at: Date.now(), rows: [] };
  return [];
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const catalog = await catalogFor(request);
  const decision = decide(url, catalog);

  if (decision.type === "redirect") {
    return new Response(null, {
      status: decision.status,
      headers: {
        Location: decision.to,
        "Cache-Control": "public, max-age=300",
      },
    });
  }
  if (decision.type === "gone") {
    return new Response(goneDocument(decision.origin), {
      status: 410,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex",
        "cache-control": "public, max-age=300",
      },
    });
  }

  const indexRes = await fetch(new URL("/index.html", request.url));
  const html = renderHtml(await indexRes.text(), decision.seo);
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "cdn-cache-control": "public, s-maxage=120, stale-while-revalidate=600",
      "x-robots-tag": decision.seo.robots || "index, follow",
    },
  });
}
