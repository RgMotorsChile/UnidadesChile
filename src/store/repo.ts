import { cars } from "../data/cars";
import { SITE } from "../lib/config";
import { isUnidadesChileStock } from "../lib/sources";
import { idbClear, idbDelete, idbGet, idbGetAll, idbPut } from "./idb";
import type { AdminUser, Lead, MediaAsset, Publication, SiteSettings, Vehicle } from "./types";

const SETTINGS_ID = "site";
const AUTH_ID = "auth";
const SEEDED = "uc-seed-v1";
const LOCATION_MIGRATE = "uc-location-pm-v2";
const L200_MIGRATE = "uc-hero-l200-v1";
const STOCK_MIGRATE = "uc-stock-unidades-chile-v3";

export function nowIso() {
  return new Date().toISOString();
}

export function uid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function seedIfNeeded() {
  if (localStorage.getItem(SEEDED)) {
    const existing = await idbGetAll<Vehicle>("vehicles");
    if (existing.length) {
      await migrateLocation();
      await migrateHeroL200();
      await migrateStock();
      return;
    }
  }
  const stamped = nowIso();
  for (const car of cars) {
    const vehicle: Vehicle = {
      ...car,
      status: "publicado",
      notas: "",
      vistas: 0,
      createdAt: stamped,
      updatedAt: stamped,
    };
    await idbPut("vehicles", vehicle);
  }
  const settings: SiteSettings & { id: string } = {
    id: SETTINGS_ID,
    ...SITE,
    homeHeadline1: "El precio justo.",
    homeHeadline2: "El auto que quieres.",
    homeSub: "Autos seleccionados. Precios bajo mercado. Entrega en todo Chile.",
  };
  await idbPut("settings", settings);
  localStorage.setItem(SEEDED, "1");
  await migrateLocation();
  await migrateHeroL200();
  await migrateStock();
}

async function migrateLocation() {
  if (localStorage.getItem(LOCATION_MIGRATE)) return;
  const current = await getSettings();
  await saveSettings({
    ...current,
    city: SITE.city,
    address: SITE.address,
    mapQuery: SITE.mapQuery,
  });
  const existing = await vehiclesRepo.all();
  for (const v of existing) {
    if (v.ciudad === "Santiago") {
      await idbPut("vehicles", { ...v, ciudad: "Puerto Montt", updatedAt: nowIso() });
    }
  }
  localStorage.setItem(LOCATION_MIGRATE, "1");
}

async function migrateHeroL200() {
  if (localStorage.getItem(L200_MIGRATE)) return;
  localStorage.setItem(L200_MIGRATE, "1");
}

async function migrateStock() {
  if (localStorage.getItem(STOCK_MIGRATE)) return;
  const existing = await vehiclesRepo.all();
  for (const v of existing) await vehiclesRepo.remove(v.id);
  const stamped = nowIso();
  for (const car of cars) {
    await idbPut("vehicles", {
      ...car,
      status: "publicado",
      notas: "",
      vistas: 0,
      createdAt: stamped,
      updatedAt: stamped,
    });
  }
  localStorage.setItem(STOCK_MIGRATE, "1");
}

export const vehiclesRepo = {
  all: () => idbGetAll<Vehicle>("vehicles"),
  get: (id: string) => idbGet<Vehicle>("vehicles", id),
  save: (v: Vehicle) => idbPut("vehicles", { ...v, updatedAt: nowIso() }),
  remove: (id: string) => idbDelete("vehicles", id),
};

export const publicationsRepo = {
  all: () => idbGetAll<Publication>("publications"),
  get: (id: string) => idbGet<Publication>("publications", id),
  save: (p: Publication) => idbPut("publications", { ...p, updatedAt: nowIso() }),
  remove: (id: string) => idbDelete("publications", id),
};

export const leadsRepo = {
  all: () => idbGetAll<Lead>("leads"),
  save: (l: Lead) => idbPut("leads", l),
  remove: (id: string) => idbDelete("leads", id),
};

export const mediaRepo = {
  all: () => idbGetAll<MediaAsset>("media"),
  get: (id: string) => idbGet<MediaAsset>("media", id),
  async putFile(file: File, kind: MediaAsset["kind"]) {
    const id = uid("media");
    const asset: MediaAsset = {
      id,
      nombre: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      kind,
      createdAt: nowIso(),
    };
    await idbPut("media", asset);
    await idbPut("blobs", file, id);
    return asset;
  },
  async blob(id: string) {
    return idbGet<Blob>("blobs", id);
  },
  async remove(id: string) {
    await idbDelete("media", id);
    await idbDelete("blobs", id);
  },
};

export async function getSettings(): Promise<SiteSettings> {
  const row = await idbGet<SiteSettings & { id: string }>("settings", SETTINGS_ID);
  if (row) {
    const { id: _id, ...rest } = row;
    return rest;
  }
  return {
    ...SITE,
    homeHeadline1: "El precio justo.",
    homeHeadline2: "El auto que quieres.",
    homeSub: "Autos seleccionados. Precios bajo mercado. Entrega en todo Chile.",
  };
}

export async function saveSettings(s: SiteSettings) {
  await idbPut("settings", { id: SETTINGS_ID, ...s });
}

export type AdminRecord =
  | { user: string; passwordHash: string }
  | { user: string; legacyPassword: string };

export async function getAdminRecord(): Promise<AdminRecord | null> {
  const row = await idbGet<Record<string, string>>("settings", AUTH_ID);
  if (!row) return null;
  if (typeof row.passwordHash === "string" && row.passwordHash) {
    return { user: String(row.user ?? ""), passwordHash: row.passwordHash };
  }
  if (typeof row.password === "string" && row.password) {
    return { user: String(row.user ?? ""), legacyPassword: row.password };
  }
  return null;
}

export async function saveAdminUser(user: AdminUser) {
  await idbPut("settings", { id: AUTH_ID, user: user.user, passwordHash: user.passwordHash });
}

export async function exportBackup() {
  const [vehicles, publications, leads, media, settings] = await Promise.all([
    vehiclesRepo.all(),
    publicationsRepo.all(),
    leadsRepo.all(),
    mediaRepo.all(),
    idbGetAll<{ id: string }>("settings"),
  ]);
  return {
    exportedAt: nowIso(),
    vehicles,
    publications,
    leads,
    media,
    settings: settings.filter((row) => row.id !== AUTH_ID),
  };
}

export async function reseedCatalog() {
  await idbClear("vehicles");
  const stamped = nowIso();
  for (const car of cars) {
    await idbPut("vehicles", {
      ...car,
      status: "publicado",
      notas: "",
      vistas: 0,
      createdAt: stamped,
      updatedAt: stamped,
    });
  }
  localStorage.setItem(SEEDED, "1");
  localStorage.setItem(STOCK_MIGRATE, "1");
}

export async function resetCatalog() {
  await reseedCatalog();
}

export async function importBackup(dump: {
  vehicles?: Vehicle[];
  publications?: Publication[];
  leads?: Lead[];
  settings?: Array<Record<string, unknown>>;
}) {
  if (dump.vehicles?.length) {
    await idbClear("vehicles");
    for (const v of dump.vehicles) {
      if (isUnidadesChileStock(v.unidad)) await idbPut("vehicles", v);
    }
    localStorage.setItem(SEEDED, "1");
    localStorage.setItem(STOCK_MIGRATE, "1");
  }
  if (dump.publications) {
    await idbClear("publications");
    for (const p of dump.publications) await idbPut("publications", p);
  }
  if (dump.leads) {
    await idbClear("leads");
    for (const l of dump.leads) await idbPut("leads", l);
  }
  if (dump.settings?.length) {
    for (const row of dump.settings) {
      if (row && typeof row.id === "string" && row.id !== AUTH_ID) {
        await idbPut("settings", row);
      }
    }
  }
}

