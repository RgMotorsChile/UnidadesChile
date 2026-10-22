import { jsonLdScript } from "./vehiclePublic.mjs";

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function upsertMeta(html, attr, key, content) {
  const tag = `<meta ${attr}="${key}" content="${esc(content)}" />`;
  const re = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, "i");
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

export function applyHead(html, seo) {
  let out = String(html || "");
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${esc(seo.title)}</title>`);
  out = upsertMeta(out, "name", "description", seo.description);
  out = upsertMeta(out, "property", "og:type", seo.ogType || "website");
  out = upsertMeta(out, "property", "og:url", seo.canonical);
  out = upsertMeta(out, "property", "og:title", seo.title);
  out = upsertMeta(out, "property", "og:description", seo.description);
  out = upsertMeta(out, "property", "og:image", seo.ogImage);
  out = upsertMeta(out, "property", "og:image:width", "1200");
  out = upsertMeta(out, "property", "og:image:height", "630");
  out = upsertMeta(out, "property", "og:image:alt", seo.ogImageAlt || seo.title);
  out = upsertMeta(out, "name", "twitter:card", "summary_large_image");
  out = upsertMeta(out, "name", "twitter:title", seo.title);
  out = upsertMeta(out, "name", "twitter:description", seo.description);
  out = upsertMeta(out, "name", "twitter:image", seo.ogImage);
  out = out.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${esc(seo.canonical)}" />`,
  );
  if (!/rel="canonical"/i.test(out)) {
    out = out.replace("</head>", `    <link rel="canonical" href="${esc(seo.canonical)}" />\n  </head>`);
  }
  if (seo.preload?.href) {
    const preload = `<link rel="preload" as="image" href="${esc(seo.preload.href)}" imagesrcset="${esc(seo.preload.srcSet)}" imagesizes="${esc(seo.preload.sizes)}" type="image/avif" fetchpriority="high" />`;
    out = out.replace("</head>", `    ${preload}\n  </head>`);
  }
  const ld = `<script type="application/ld+json">${jsonLdScript(seo.jsonLd)}</script>`;
  if (/application\/ld\+json/i.test(out)) {
    out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, ld);
  } else {
    out = out.replace("</head>", `    ${ld}\n  </head>`);
  }
  return out;
}

export function goneHtml(origin) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Unidad no disponible | Unidades Chile</title><meta name="robots" content="noindex"><link rel="canonical" href="${esc(origin)}/catalogo"></head><body><h1>Esta unidad ya no está publicada</h1><p>No tenemos una ficha vigente en este sitio ni en el dominio de la sucursal.</p><p><a href="${esc(origin)}/catalogo">Ver el catálogo</a></p></body></html>`;
}
