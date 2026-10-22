/**
 * URL pública, sucursal y textos SEO sin patente.
 * Compartido por la vitrina, el middleware y los tests.
 */

export const SITE_URL = "https://www.unidadeschile.cl";

export const DEALER = {
  name: "Unidades Chile",
  legal: "Unidades Chile Automotriz",
  // Cada sitio conserva su WhatsApp. No unificar con RG ni Salgado.
  whatsapp: "56973236636",
  phoneDisplay: "+56 9 7323 6636",
  // DUDA MATHIAS: el buzón público sigue siendo administracion@rgmotors.cl
  // (dominio de RG Motors), no un correo @unidadeschile.cl.
  email: "administracion@rgmotors.cl",
  city: "Puerto Montt, Chile",
  address: "Regimiento #1207, Puerto Montt",
  hours: "Lun a Sáb · 10:00 a 19:00",
  mapQuery: "Regimiento 1207, Puerto Montt, Los Lagos, Chile",
};

export const BRANCHES = {
  "unidades-chile": {
    id: "unidades-chile",
    label: "Unidades Chile",
    origin: SITE_URL,
    carPath: (slug) => `/catalogo/${slug}`,
  },
  "rg-motors": {
    id: "rg-motors",
    label: "RG Motors",
    origin: "https://www.rgmotorschile.cl",
    carPath: (slug) => `/vehiculo/${slug}`,
  },
  salgado: {
    id: "salgado",
    label: "Salgado Automotriz",
    origin: "https://salgadoautomotriz.cl",
    carPath: () => null,
  },
};

/**
 * Autos del seed local que la hoja ubica en otra sucursal.
 * No se publican en este dominio. El destino externo solo se usa si la ficha
 * del otro sitio responde hoy; si no hay URL confirmada, la respuesta es 410.
 */
export const OTHER_BRANCH = {
  SHYL53: {
    branch: "rg-motors",
    legacySlug: "ford-ranger-4x4-2023-shyl53",
    external: "https://www.rgmotorschile.cl/vehiculo/ford-ranger-4x4-2023-shyl53",
  },
  STPZ87: {
    branch: "rg-motors",
    legacySlug: "maxus-t60-4x2-at-2023-stpz87",
    external: "https://www.rgmotorschile.cl/vehiculo/maxus-t60-4x2-at-2023-stpz87",
  },
  RYGB56: {
    branch: "salgado",
    legacySlug: "mg-3-hatch-back-2022-rygb56",
    external: null,
  },
};

const ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function plateKey(unidad) {
  return String(unidad || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fnv(seed) {
  let h = 2166136261;
  const s = `uc:${seed}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shortPublicId(seed, plate) {
  const banned = plateKey(plate).toLowerCase();
  let salt = String(seed || "auto");
  for (let attempt = 0; attempt < 6; attempt += 1) {
    let n = fnv(`${salt}#${attempt}`);
    let out = "";
    for (let i = 0; i < 6; i += 1) {
      out += ID_ALPHABET[n % ID_ALPHABET.length];
      n = Math.floor(n / ID_ALPHABET.length) + ((fnv(salt) >>> i) & 255);
    }
    if (!banned || (!out.includes(banned) && out !== banned)) return out;
  }
  return "k7m3qx";
}

export function stripPlate(text, plate) {
  const compact = plateKey(plate);
  const raw = String(text || "");
  if (!raw || compact.length < 5) return raw.trim();
  const variants = new Set([
    compact,
    `${compact.slice(0, 4)} ${compact.slice(4)}`,
    `${compact.slice(0, 2)} ${compact.slice(2)}`,
    `${compact.slice(0, 4)}-${compact.slice(4)}`,
  ]);
  let out = raw;
  for (const variant of variants) {
    const esc = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(esc, "ig"), " ");
  }
  return out.replace(/\s{2,}/g, " ").replace(/\s+([,.;:|·])/g, "$1").trim();
}

export function versionForSlug(modelo, version, plate) {
  const clean = stripPlate(version || "", plate);
  const model = stripPlate(modelo || "", plate);
  if (!clean) return "";
  const a = slugify(clean);
  const b = slugify(model);
  if (!a || a === b || b.includes(a) || a.includes(b)) return "";
  return clean;
}

export function publicSlug(car) {
  const plate = plateKey(car.unidad || car.plate);
  const marca = car.marca || car.brand || "";
  const modelo = car.modelo || car.model || "";
  const year = Number(car.year) || 0;
  const version = versionForSlug(modelo, car.version, plate);
  const parts = [marca, modelo, version, year > 0 ? String(year) : ""].filter(Boolean);
  const banned = plate.toLowerCase();
  const base = slugify(parts.join(" "))
    .split("-")
    .filter((part) => part && part !== banned)
    .join("-");
  const id = shortPublicId(car.id || car.slug || base, plate);
  const slug = `${base || "auto"}-${id}`;
  return banned && slug.includes(banned) ? slug.replaceAll(banned, id) : slug;
}

export function catalogPath(car) {
  return `/catalogo/${publicSlug(car)}`;
}

export function isListedHere(car) {
  const plate = plateKey(car?.unidad || car?.plate);
  if (OTHER_BRANCH[plate]) return false;
  const branch = car?.sucursal || car?.branch;
  if (branch && branch !== "unidades-chile") return false;
  return true;
}

export function clp(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function priceLabel(value) {
  return clp(value) || "Precio pendiente";
}

export function publicOrigin(host, fallbackOrigin) {
  const hostname = String(host || "")
    .split(":")[0]
    .toLowerCase();
  if (hostname === "unidadeschile.cl" || hostname === "www.unidadeschile.cl") return SITE_URL;
  if (fallbackOrigin) return String(fallbackOrigin).replace(/\/$/, "");
  return SITE_URL;
}

export function vehicleTitle(car) {
  const plate = car.unidad || car.plate;
  const name = stripPlate(
    [car.marca || car.brand, car.modelo || car.model, Number(car.year) > 0 ? car.year : ""]
      .filter(Boolean)
      .join(" "),
    plate,
  );
  const price = clp(car.precio ?? car.price);
  return stripPlate(`${name}${price ? ` · ${price}` : ""} | Unidades Chile`, plate);
}

export function vehicleDescription(car) {
  const plate = car.unidad || car.plate;
  const name = stripPlate(
    [car.marca || car.brand, car.modelo || car.model, Number(car.year) > 0 ? car.year : "año pendiente"]
      .filter(Boolean)
      .join(" "),
    plate,
  );
  const price = priceLabel(car.precio ?? car.price);
  return stripPlate(
    `${name} por ${price} en Unidades Chile, ${DEALER.address}. Reserva con $200.000 o agenda una prueba de manejo.`,
    plate,
  );
}

export function vehicleAlt(car) {
  const plate = car.unidad || car.plate;
  return stripPlate(
    [car.marca || car.brand, car.modelo || car.model, Number(car.year) > 0 ? car.year : ""]
      .filter(Boolean)
      .join(" "),
    plate,
  );
}

function absoluteUrl(origin, src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${origin}${src.startsWith("/") ? src : `/${src}`}`;
}

export function coverOf(car) {
  const list = Array.isArray(car.imagenes) ? car.imagenes : car.image ? [car.image] : [];
  return (
    list.find((src) => src && !/placeholder-pending|fotos-en-proceso/i.test(src) && !String(src).startsWith("idb:")) ||
    ""
  );
}

export function ogImageUrl(origin, car) {
  const cover = coverOf(car);
  if (!cover) return `${origin}/og-image.png`;
  if (/supabase\.co\/storage\/v1\/object\/public\//i.test(cover)) {
    const render = cover.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const join = render.includes("?") ? "&" : "?";
    return `${render}${join}width=1200&height=630&quality=60&resize=cover`;
  }
  const slug = publicSlug(car);
  return `${origin}/api/og-image?slug=${encodeURIComponent(slug)}`;
}

export function mapStatus(raw) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("vendido") || s === "sold" || s.includes("entreg") || s.includes("vta")) return "vendido";
  if (s.includes("reserva") || s === "reservado") return "reservado";
  if (s === "borrador" || s === "draft") return "borrador";
  if (s === "publicado" || s.includes("disponible") || s === "") return "publicado";
  return "publicado";
}

export function branchOfTenant(slug) {
  if (slug === "rg-motors") return "rg-motors";
  if (slug === "salgado") return "salgado";
  if (slug === "unidades-chile") return "unidades-chile";
  return "pendiente";
}

export function externalCarUrl(branch, legacySlug) {
  const info = BRANCHES[branch];
  if (!info || branch === "unidades-chile" || !legacySlug) return null;
  const path = info.carPath(legacySlug);
  return path ? `${info.origin}${path}` : null;
}

export function normalizeRecord(raw, branch) {
  const plate = plateKey(raw.unidad || raw.plate);
  const legacySlug = String(raw.id || raw.slug || "");
  const forced = OTHER_BRANCH[plate];
  const sucursal = forced?.branch || branch || raw.sucursal || "unidades-chile";
  const car = {
    id: legacySlug,
    unidad: raw.unidad || raw.plate || plate,
    marca: raw.marca || raw.brand || "",
    modelo: raw.modelo || raw.model || "",
    version: raw.version || "",
    year: Number(raw.year) || 0,
    precio: Number(raw.precio ?? raw.price) || 0,
    mercado: Number(raw.mercado) || 0,
    km: Number(raw.km) || 0,
    imagenes: raw.imagenes || (raw.image ? [raw.image] : []),
    status: mapStatus(raw.status || "publicado"),
    updatedAt: raw.updatedAt || raw.updated_at || "",
    sucursal,
    marcaPendiente: !(raw.marca || raw.brand),
    precioPendiente: !(Number(raw.precio ?? raw.price) > 0),
    kmPendiente: !(Number(raw.km) > 0),
  };
  car.publicSlug = publicSlug(car);
  car.external =
    forced?.external ||
    (sucursal !== "unidades-chile" ? externalCarUrl(sucursal, legacySlug) : null);
  return car;
}

export function resolveVehicle(param, catalog) {
  const key = decodeURIComponent(String(param || "")).trim();
  if (!key) return { type: "missing" };
  const rows = catalog || [];
  const here = rows.find(
    (car) => car.sucursal === "unidades-chile" && (car.publicSlug === key || car.id === key),
  );
  if (here) {
    if (here.status === "vendido") {
      return { type: "redirect", status: 301, to: "/catalogo?estado=vendido" };
    }
    if (here.status !== "publicado" && here.status !== "reservado") {
      return { type: "redirect", status: 301, to: "/catalogo?estado=vendido" };
    }
    if (key !== here.publicSlug) {
      return { type: "redirect", status: 301, to: `/catalogo/${here.publicSlug}` };
    }
    return { type: "ok", car: here };
  }

  const elsewhere = rows.find(
    (car) => car.sucursal !== "unidades-chile" && (car.id === key || car.publicSlug === key),
  );
  const forced = Object.values(OTHER_BRANCH).find((row) => row.legacySlug === key);
  const target = elsewhere || null;
  if (target || forced) {
    const external = target?.external || forced?.external || null;
    if (external) return { type: "redirect", status: 301, to: external };
    return { type: "gone" };
  }
  return { type: "missing" };
}

export const STATIC_PAGES = [
  ["/", "Unidades Chile Automotriz", "Autos seleccionados en Puerto Montt. Precio bajo mercado, inspección 180 puntos y financiamiento."],
  ["/catalogo", "Catálogo | Unidades Chile", "Stock de Unidades Chile en Regimiento #1207, Puerto Montt. Reserva con $200.000 y prueba de manejo."],
  ["/consigna-tu-vehiculo", "Consigna tu vehículo | Unidades Chile", "Consigna tu auto en Unidades Chile, Regimiento #1207, Puerto Montt."],
  ["/financia", "Financia | Unidades Chile", "Simula tu cuota en Unidades Chile. Referencial, con pie de 20% a 48 meses."],
  ["/nosotros", "Nosotros | Unidades Chile", "Unidades Chile Automotriz en Regimiento #1207, Puerto Montt."],
  ["/novedades", "Novedades | Unidades Chile", "Novedades de Unidades Chile Automotriz."],
  ["/comparador", "Comparador | Unidades Chile", "Compara unidades del stock de Unidades Chile en Puerto Montt."],
  ["/contacto", "Contacto | Unidades Chile", "Visítanos en Regimiento #1207, Puerto Montt, o escríbenos por WhatsApp."],
  ["/privacidad", "Privacidad | Unidades Chile", "Política de privacidad de Unidades Chile Automotriz."],
  ["/terminos", "Términos | Unidades Chile", "Términos y condiciones de Unidades Chile Automotriz."],
  ["/cookies", "Cookies | Unidades Chile", "Política de cookies de Unidades Chile Automotriz."],
  ["/aviso-credito", "Aviso de crédito | Unidades Chile", "Aviso legal del simulador de crédito de Unidades Chile."],
  ["/condiciones-reserva", "Condiciones de reserva | Unidades Chile", "Condiciones de la reserva de $200.000 en Unidades Chile."],
];

const STATIC_MAP = new Map(STATIC_PAGES);

export function crumbLabel(pathname) {
  if (pathname === "/") return "Inicio";
  const known = STATIC_MAP.get(pathname);
  if (known) return known[0].replace(" | Unidades Chile", "");
  return "Página";
}

export function breadcrumbJson(origin, items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function dealerJson(origin) {
  return {
    "@type": "AutoDealer",
    name: DEALER.legal,
    url: `${origin}/`,
    logo: `${origin}/logos/logo-dark.png`,
    image: `${origin}/og-image.png`,
    email: DEALER.email,
    telephone: "+56973236636",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Regimiento 1207",
      addressLocality: "Puerto Montt",
      addressCountry: "CL",
    },
    openingHours: "Mo-Sa 10:00-19:00",
  };
}

export function websiteJson(origin) {
  return {
    "@type": "WebSite",
    name: DEALER.legal,
    url: `${origin}/`,
    inLanguage: "es-CL",
    publisher: { "@type": "AutoDealer", name: DEALER.legal, url: `${origin}/` },
  };
}

export function carJson(origin, car) {
  const plate = car.unidad || car.plate;
  const name = stripPlate(`${car.marca} ${car.modelo}`.trim(), plate);
  const image = ogImageUrl(origin, car);
  const node = {
    "@type": "Car",
    name,
    brand: { "@type": "Brand", name: stripPlate(car.marca, plate) },
    model: stripPlate(car.modelo, plate),
    image,
    vehicleCondition: "https://schema.org/UsedCondition",
    url: `${origin}/catalogo/${car.publicSlug}`,
  };
  if (Number(car.year) > 0) node.modelDate = String(car.year);
  if (Number(car.km) > 0) {
    node.mileageFromOdometer = {
      "@type": "QuantitativeValue",
      value: Number(car.km),
      unitCode: "KMT",
    };
  }
  if (Number(car.precio) > 0) {
    node.offers = {
      "@type": "Offer",
      price: Number(car.precio),
      priceCurrency: "CLP",
      availability:
        car.status === "reservado" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
      url: `${origin}/catalogo/${car.publicSlug}`,
      itemCondition: "https://schema.org/UsedCondition",
    };
  }
  return node;
}

export function pageSeo(origin, pathname, car) {
  const path = pathname === "" ? "/" : pathname;
  const canonical = `${origin}${path === "/" ? "/" : path}`;
  if (car) {
    const title = vehicleTitle(car);
    const description = vehicleDescription(car);
    return {
      title,
      description,
      canonical: `${origin}/catalogo/${car.publicSlug}`,
      ogType: "product",
      ogImage: ogImageUrl(origin, car),
      ogImageAlt: vehicleAlt(car),
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          websiteJson(origin),
          dealerJson(origin),
          breadcrumbJson(origin, [
            { name: "Inicio", url: `${origin}/` },
            { name: "Catálogo", url: `${origin}/catalogo` },
            { name: stripPlate(`${car.marca} ${car.modelo}`, car.unidad), url: `${origin}/catalogo/${car.publicSlug}` },
          ]),
          carJson(origin, car),
        ],
      },
    };
  }
  const known = STATIC_MAP.get(path) || ["Unidades Chile Automotriz", "Autos seleccionados en Puerto Montt."];
  const [title, description] = known;
  const crumbs = [{ name: "Inicio", url: `${origin}/` }];
  if (path !== "/") crumbs.push({ name: crumbLabel(path), url: canonical });
  return {
    title,
    description,
    canonical,
    ogType: "website",
    ogImage: `${origin}/og-image.png`,
    ogImageAlt: "Unidades Chile Automotriz",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [websiteJson(origin), dealerJson(origin), breadcrumbJson(origin, crumbs)],
    },
  };
}

export function sitemapXml(origin, catalog) {
  const urls = STATIC_PAGES.map(([path]) => ({
    loc: `${origin}${path === "/" ? "/" : path}`,
    lastmod: new Date().toISOString(),
  }));
  for (const car of catalog || []) {
    if (car.sucursal !== "unidades-chile") continue;
    if (car.status !== "publicado" && car.status !== "reservado") continue;
    if (!isListedHere(car) && OTHER_BRANCH[plateKey(car.unidad)]) continue;
    urls.push({
      loc: `${origin}/catalogo/${car.publicSlug}`,
      lastmod: car.updatedAt || new Date().toISOString(),
    });
  }
  const body = urls
    .map(
      (url) =>
        `  <url><loc>${escapeXml(url.loc)}</loc><lastmod>${escapeXml(url.lastmod)}</lastmod></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function jsonLdScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
