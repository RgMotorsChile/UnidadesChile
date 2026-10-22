import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { pageSeo, publicOrigin, publicSlug } from "@shared/vehiclePublic.mjs";

type SeoCar = {
  id: string;
  unidad: string;
  marca: string;
  modelo: string;
  version: string;
  year: number;
  precio: number;
  km: number;
  imagenes: string[];
  status?: string;
};

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: unknown) {
  let el = document.getElementById("uc-jsonld");
  if (!el) {
    el = document.createElement("script");
    el.id = "uc-jsonld";
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
}

export function PageTitle({
  title,
  description,
  car,
  robots,
}: {
  title?: string;
  description?: string;
  car?: SeoCar;
  robots?: string;
}) {
  const { pathname } = useLocation();
  const carRef = useRef(car);
  carRef.current = car;
  const carKey = car ? `${car.id}|${car.precio}|${car.km}|${car.imagenes?.[0] || ""}|${car.status || ""}` : "";

  useEffect(() => {
    const origin = publicOrigin(window.location.host, window.location.origin);
    const current = carRef.current;
    const prepared = current
      ? { ...current, publicSlug: publicSlug(current), status: current.status || "publicado" }
      : undefined;
    const seo = pageSeo(origin, pathname, prepared);
    if (!current && title) seo.title = title;
    if (!current && description) seo.description = description;
    document.title = seo.title;
    setMeta("name", "description", seo.description);
    setMeta("name", "robots", robots || seo.robots || "index, follow");
    setMeta("property", "og:type", seo.ogType);
    setMeta("property", "og:url", seo.canonical);
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:image", seo.ogImage);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:image:alt", seo.ogImageAlt);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);
    setMeta("name", "twitter:image", seo.ogImage);
    setCanonical(seo.canonical);
    setJsonLd(seo.jsonLd);
  }, [pathname, title, description, carKey, robots]);

  return null;
}
