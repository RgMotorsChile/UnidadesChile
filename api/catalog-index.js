import { getCatalog } from "../server/seoGate.mjs";

export const config = { runtime: "nodejs" };

export default async function handler(_req, res) {
  const rows = await getCatalog();
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=60, stale-while-revalidate=300");
  res.status(200).json(rows);
}
