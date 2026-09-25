import {
  deny,
  isAdminRequest,
  supabaseAdmin,
  supabaseAnon,
  tenantId,
} from "./_lib";

function toRgStatus(status: string) {
  if (status === "publicado") return "Disponible";
  if (status === "reservado") return "En reserva";
  if (status === "vendido") return "Vendido";
  if (status === "Disponible" || status === "En reserva" || status === "Vendido" || status === "Borrador") {
    return status;
  }
  return "Borrador";
}

function vehicleToRow(v: Record<string, unknown>, tenant: string) {
  const imagenes = Array.isArray(v.imagenes) ? (v.imagenes as string[]).filter(Boolean) : [];
  const status = toRgStatus(String(v.status || "publicado"));
  return {
    tenant_id: tenant,
    slug: String(v.id || v.slug || ""),
    plate: String(v.unidad || v.plate || ""),
    brand: String(v.marca || v.brand || ""),
    model: String(v.modelo || v.model || ""),
    version: String(v.version || v.modelo || ""),
    year: Number(v.year) || 0,
    price: Number(v.precio ?? v.price) || 0,
    list_price: v.mercado != null ? Number(v.mercado) : v.list_price != null ? Number(v.list_price) : null,
    km: Number(v.km) || 0,
    fuel: String(v.combustible || v.fuel || ""),
    transmission: String(v.transmision || v.transmission || ""),
    body_type: String(v.carroceria || v.body_type || ""),
    location: String(v.ciudad || v.location || "Puerto Montt"),
    image: imagenes[0] || String(v.image || ""),
    gallery: imagenes,
    featured: Boolean(v.destacado ?? v.featured),
    status,
    traction: String(v.traccion || v.traction || ""),
    owners: Number(v.duenos ?? v.owners) || 1,
    updated_at: new Date().toISOString(),
  };
}

export default async function handler(
  req: { method?: string; body?: Record<string, unknown>; headers?: { cookie?: string }; query?: { slug?: string } },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (!isAdminRequest(req)) return deny(res);
  const method = req.method || "GET";
  const reader = supabaseAdmin() || supabaseAnon();
  if (!reader) return res.status(503).json({ ok: false, error: "Supabase no configurado." });
  const tenant = await tenantId(reader);
  if (!tenant) return res.status(500).json({ ok: false, error: "Tenant no encontrado." });

  if (method === "GET") {
    const { data, error } = await reader
      .from("catalog_vehicles")
      .select("*")
      .eq("tenant_id", tenant)
      .order("updated_at", { ascending: false });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, vehicles: data || [] });
  }

  const writer = supabaseAdmin();
  if (!writer) {
    return res.status(503).json({
      ok: false,
      error: "Falta SUPABASE_SERVICE_ROLE_KEY para guardar en el catálogo real.",
    });
  }

  if (method === "POST" || method === "PUT") {
    const row = vehicleToRow(req.body || {}, tenant);
    if (!row.slug) return res.status(400).json({ ok: false, error: "Falta slug." });
    const { error } = await writer.from("catalog_vehicles").upsert(row, { onConflict: "tenant_id,slug" });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, slug: row.slug });
  }

  if (method === "DELETE") {
    const slug = String(req.query?.slug || req.body?.id || req.body?.slug || "");
    if (!slug) return res.status(400).json({ ok: false, error: "Falta slug." });
    const { error } = await writer.from("catalog_vehicles").delete().eq("tenant_id", tenant).eq("slug", slug);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: "Método no permitido." });
}
