import type { Vehicle, VehicleStatus } from "../store/types";
import { orderGalleryWithCover } from "./frontCoverMap";

export function toUcStatus(raw: string | undefined): VehicleStatus {
  const s = (raw || "").toLowerCase();
  if (s.includes("reserva")) return "reservado";
  if (s.includes("vendido")) return "vendido";
  if (s.includes("borrador") || s === "draft") return "borrador";
  return "publicado";
}

export function toRgStatus(status: VehicleStatus): string {
  if (status === "reservado") return "En reserva";
  if (status === "vendido") return "Vendido";
  if (status === "borrador") return "Borrador";
  return "Disponible";
}

export function rowToAdminVehicle(row: Record<string, unknown>): Vehicle {
  const gallery = Array.isArray(row.gallery) ? (row.gallery as string[]) : [];
  const image = String(row.image || "");
  const precio = Number(row.price) || 0;
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
    transmision: /auto/i.test(String(row.transmission || "")) ? "Automático" : "Manual",
    combustible: /di[eé]sel/i.test(String(row.fuel || ""))
      ? "Diésel"
      : /h[ií]brid/i.test(String(row.fuel || ""))
        ? "Híbrido"
        : "Bencina",
    traccion: /4\s*x\s*4|4wd|awd/i.test(String(row.traction || "")) ? "4x4" : "4x2",
    duenos: Number(row.owners) || 1,
    carroceria: "Pickup",
    ciudad: String(row.location || "Puerto Montt"),
    destacado: Boolean(row.featured),
    certificado: true,
    cuota: 0,
    imagenes: orderGalleryWithCover(image, gallery.length ? gallery : image ? [image] : []),
    status: toUcStatus(row.status != null ? String(row.status) : undefined),
    notas: "",
    vistas: 0,
    createdAt: row.created_at ? String(row.created_at) : "",
    updatedAt: row.updated_at ? String(row.updated_at) : "",
  };
}

async function parse(res: Response) {
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

export async function adminLogin(user: string, password: string) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ user, password }),
  });
  await parse(res);
}

export async function adminLogout() {
  await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
}

export async function adminFetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/admin/vehicles", { credentials: "include" });
  const data = (await res.json()) as { ok?: boolean; vehicles?: Record<string, unknown>[]; error?: string };
  if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo leer el inventario.");
  return (data.vehicles || []).map(rowToAdminVehicle);
}

export async function adminSaveVehicle(vehicle: Vehicle) {
  const res = await fetch("/api/admin/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(vehicle),
  });
  await parse(res);
}

export async function adminDeleteVehicle(slug: string) {
  const res = await fetch(`/api/admin/vehicles?slug=${encodeURIComponent(slug)}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parse(res);
}

export async function adminSellVehicle(slug: string, salePrice: number, supplier = "Unidades Chile") {
  const res = await fetch("/api/admin/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ slug, salePrice, supplier }),
  });
  await parse(res);
}

export async function adminSyncInventory() {
  const res = await fetch("/api/admin/sync", { method: "POST", credentials: "include" });
  return parse(res);
}

export async function adminSetCover(slug: string, coverUrl: string) {
  const res = await fetch("/api/admin/photos", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, action: "set_cover", coverUrl }),
  });
  await parse(res);
}

export async function adminReorderPhotos(slug: string, gallery: string[]) {
  const res = await fetch("/api/admin/photos", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, action: "reorder", gallery }),
  });
  await parse(res);
}
