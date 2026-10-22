import {
  branchOfTenant,
  mapStatus,
  normalizeRecord,
  OTHER_BRANCH,
  plateKey,
} from "./vehiclePublic.mjs";

const CACHE_MS = 60_000;
let cache = null;

function headers(key) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

async function fetchJson(url, key) {
  const res = await fetch(url, { headers: headers(key) });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  return res.json();
}

export async function fetchRemoteCatalog(env = process.env) {
  const url = String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(
    env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  ).trim();
  if (!url || !key) return null;

  const tenants = await fetchJson(`${url}/rest/v1/tenants?select=id,slug`, key);
  const byId = new Map((tenants || []).map((row) => [row.id, row.slug]));
  const cols = "slug,plate,brand,model,version,year,price,km,location,image,status,updated_at,tenant_id";
  const rows = await fetchJson(
    `${url}/rest/v1/catalog_vehicles?select=${cols}&order=updated_at.desc`,
    key,
  );
  return (rows || []).map((row) => {
    const tenant = byId.get(row.tenant_id) || "";
    const branch = branchOfTenant(tenant);
    return normalizeRecord(
      {
        id: row.slug,
        plate: row.plate,
        brand: row.brand,
        model: row.model,
        version: row.version,
        year: row.year,
        price: row.price,
        km: row.km,
        image: row.image,
        status: mapStatus(row.status),
        updated_at: row.updated_at,
      },
      branch === "pendiente" ? "unidades-chile" : branch,
    );
  });
}

export function catalogFromLocal(cars) {
  return (cars || []).map((car) => {
    const plate = plateKey(car.unidad);
    const forced = OTHER_BRANCH[plate];
    return normalizeRecord(car, forced?.branch || "unidades-chile");
  });
}

export async function loadCatalog({ localCars, env = process.env, force = false } = {}) {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  try {
    const remote = await fetchRemoteCatalog(env);
    if (remote && remote.length) {
      cache = { at: Date.now(), rows: remote };
      return remote;
    }
  } catch {
    /* sin red o sin llave: seed local */
  }
  const rows = catalogFromLocal(localCars || []);
  cache = { at: Date.now(), rows };
  return rows;
}

export function clearCatalogCache() {
  cache = null;
}
