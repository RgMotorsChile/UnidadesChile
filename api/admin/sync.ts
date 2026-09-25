import { deny, isAdminRequest } from "./_lib";

export default async function handler(
  req: { method?: string; headers?: { cookie?: string } },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método no permitido." });
  if (!isAdminRequest(req)) return deny(res);
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) {
    return res.status(503).json({
      ok: false,
      error: "Falta CRON_SECRET para disparar el sync de planilla y Drive.",
    });
  }
  const url =
    process.env.UC_SYNC_URL ||
    "https://www.rgmotorschile.cl/api/cron/sync?tenant=unidades-chile&only=all";
  try {
    const remote = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
    });
    const text = await remote.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      /* keep text */
    }
    return res.status(remote.ok ? 200 : 502).json({ ok: remote.ok, sync: data });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo sincronizar.",
    });
  }
}
