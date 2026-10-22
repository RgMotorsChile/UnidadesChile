import { getCatalog } from "../server/seoGate.mjs";
import { sitemapXml, SITE_URL } from "../shared/vehiclePublic.mjs";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  const host = String(req.headers?.host || "");
  const origin =
    host && !/unidadeschile\.cl$/i.test(host.split(":")[0]) && !host.startsWith("localhost")
      ? `https://${host.split(":")[0]}`
      : SITE_URL;
  const rows = await getCatalog();
  res.setHeader("content-type", "application/xml; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=300, must-revalidate");
  res.status(200).send(sitemapXml(origin, rows));
}
