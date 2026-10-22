import { handleOg } from "../server/images.mjs";
import { getCatalog } from "../server/seoGate.mjs";

export const config = { runtime: "nodejs", maxDuration: 20 };

export default async function handler(req, res) {
  try {
    const catalog = await getCatalog();
    await handleOg(req, res, catalog);
  } catch {
    res.statusCode = 500;
    res.end("error");
  }
}
