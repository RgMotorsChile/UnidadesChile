import { deny, isAdminRequest, supabaseAdmin, tenantId } from "./_lib";

export default async function handler(
  req: { method?: string; body?: { slug?: string; salePrice?: number; supplier?: string }; headers?: { cookie?: string } },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método no permitido." });
  if (!isAdminRequest(req)) return deny(res);
  const writer = supabaseAdmin();
  if (!writer) {
    return res.status(503).json({ ok: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY." });
  }
  const tenant = await tenantId(writer);
  if (!tenant) return res.status(500).json({ ok: false, error: "Tenant no encontrado." });
  const slug = String(req.body?.slug || "");
  if (!slug) return res.status(400).json({ ok: false, error: "Falta slug." });

  const { data: row } = await writer
    .from("catalog_vehicles")
    .select("*")
    .eq("tenant_id", tenant)
    .eq("slug", slug)
    .maybeSingle();
  if (!row) return res.status(404).json({ ok: false, error: "Vehículo no encontrado." });

  await writer.from("catalog_vehicles").update({
    status: "Vendido",
    updated_at: new Date().toISOString(),
  }).eq("tenant_id", tenant).eq("slug", slug);

  const { error: delErr } = await writer
    .from("catalog_vehicles")
    .delete()
    .eq("tenant_id", tenant)
    .eq("slug", slug);
  if (delErr) return res.status(500).json({ ok: false, error: delErr.message });

  return res.status(200).json({
    ok: true,
    success: true,
    sold: {
      slug,
      plate: row.plate,
      brand: row.brand,
      model: row.model,
      salePrice: Number(req.body?.salePrice) || Number(row.price) || 0,
      supplier: req.body?.supplier || "Unidades Chile",
      soldAt: new Date().toISOString(),
    },
  });
}
