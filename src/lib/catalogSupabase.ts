/**
 * Catálogo remoto: catalog_vehicles (tenant unidades-chile).
 */
import { cuotaDesde } from "./autofin";
import { isUnidadesChileStock } from "./sources";
import { getSupabase, isSupabaseConfigured, UC_TENANT_SLUG } from "./supabase";
import type { Vehicle, VehicleStatus } from "../store/types";

function mapStatus(raw: string | null | undefined): VehicleStatus {
  const s = (raw || "").toLowerCase();
  if (s.includes("reserva") || s === "reservado") return "reservado";
  if (
    s.includes("vendido") ||
    s === "sold" ||
    s.includes("entreg") ||
    s === "vta" ||
    s.includes("vta")
  ) {
    return "vendido";
  }
  if (s === "borrador" || s === "draft") return "borrador";
  // Disponible / publicado / En preparación → vitrina
  return "publicado";
}

function asTransmision(v: string): Vehicle["transmision"] {
  return /auto/i.test(v) ? "Automático" : "Manual";
}

function asCombustible(v: string): Vehicle["combustible"] {
  if (/di[eé]sel/i.test(v)) return "Diésel";
  if (/h[ií]brid/i.test(v)) return "Híbrido";
  return "Bencina";
}

function asTraccion(v: string): Vehicle["traccion"] {
  return /4\s*x\s*4|4wd|awd/i.test(v) ? "4x4" : "4x2";
}

function asCarroceria(v: string): Vehicle["carroceria"] {
  const t = v.toLowerCase();
  if (t.includes("suv")) return "SUV";
  if (t.includes("sed")) return "Sedán";
  if (t.includes("hatch")) return "Hatchback";
  if (t.includes("pick") || t.includes("camioneta")) return "Pickup";
  if (t.includes("cross")) return "Crossover";
  if (t.includes("furg") || t.includes("van")) return "Furgón";
  return "Pickup";
}

function rowToVehicle(row: Record<string, unknown>): Vehicle {
  const gallery = Array.isArray(row.gallery)
    ? (row.gallery as string[]).filter(Boolean)
    : [];
  const image = String(row.image || "");
  const imagenes = gallery.length ? gallery : image ? [image] : [];
  const precio = Number(row.price) || 0;
  const highlights = Array.isArray(row.highlights)
    ? (row.highlights as string[])
    : [];
  const certificado = highlights.some((h) => /certific/i.test(h));

  return {
    id: String(row.slug),
    unidad: String(row.plate || ""),
    marca: String(row.brand || ""),
    modelo: String(row.model || ""),
    version: String(row.version || row.model || ""),
    year: Number(row.year) || 0,
    precio,
    mercado: row.list_price != null ? Number(row.list_price) : precio,
    km: Number(row.km) || 0,
    transmision: asTransmision(String(row.transmission || "")),
    combustible: asCombustible(String(row.fuel || "")),
    traccion: asTraccion(String(row.traction || "")),
    duenos: Number(row.owners) || 1,
    carroceria: asCarroceria(String(row.body_type || "")),
    ciudad: String(row.location || "Puerto Montt"),
    destacado: Boolean(row.featured),
    certificado,
    cuota: cuotaDesde(precio),
    imagenes,
    status: mapStatus(row.status != null ? String(row.status) : undefined),
    notas: "",
    vistas: 0,
    createdAt: row.created_at ? String(row.created_at) : "",
    updatedAt: row.updated_at ? String(row.updated_at) : "",
  };
}

/** Lectura pública (RLS) del catálogo UC. null = no configurado o error. */
export async function fetchUcCatalogFromSupabase(): Promise<Vehicle[] | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data: tenant, error: tErr } = await sb
      .from("tenants")
      .select("id")
      .eq("slug", UC_TENANT_SLUG)
      .maybeSingle();
    if (tErr || !tenant) return null;

    const { data, error } = await sb
      .from("catalog_vehicles")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("featured", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error || !data) return null;
    return data
      .map((r) => rowToVehicle(r as Record<string, unknown>))
      .filter((car) => isUnidadesChileStock(car.unidad));
  } catch (err) {
    console.warn("[catalogSupabase] lectura UC falló:", err);
    return null;
  }
}
