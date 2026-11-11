import { resolveHandlerKey } from "../shared/apiRoute.mjs";
import catalogIndex from "./_catalog-index.js";
import consigna from "./_consigna.js";
import contacto from "./_contacto.js";
import html from "./_html.js";
import img from "./_img.js";
import ogImage from "./_og-image.js";
import sheetPlates from "./_sheet-plates.js";
import sitemap from "./_sitemap.js";
import login from "./_admin/_login.js";
import logout from "./_admin/_logout.js";
import photos from "./_admin/_photos.js";
import sell from "./_admin/_sell.js";
import sync from "./_admin/_sync.js";
import vehicles from "./_admin/_vehicles.js";

/** Una sola función. El plan Hobby corta el deploy en la número 13. */
export const config = {
  runtime: "nodejs",
  api: { bodyParser: { sizeLimit: "4mb" } },
};

const routes = {
  "catalog-index": catalogIndex,
  consigna,
  contacto,
  html,
  img,
  "og-image": ogImage,
  "sheet-plates": sheetPlates,
  sitemap,
  "admin/login": login,
  "admin/logout": logout,
  "admin/photos": photos,
  "admin/sell": sell,
  "admin/sync": sync,
  "admin/vehicles": vehicles,
};

type Req = { url?: string; query?: Record<string, unknown> };
type Res = { statusCode: number; setHeader: (k: string, v: string) => void; end: (body?: string) => void };

export default async function handler(req: Req, res: Res) {
  if (req.query && Object.prototype.hasOwnProperty.call(req.query, "route")) {
    delete req.query.route;
  }
  const key = resolveHandlerKey(req.url);
  const fn = key ? routes[key as keyof typeof routes] : undefined;
  if (!fn) {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("not found");
    return;
  }
  return fn(req as never, res as never);
}
