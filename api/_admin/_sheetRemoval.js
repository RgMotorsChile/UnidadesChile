import { plateKey } from "../../shared/vehiclePublic.mjs";
import { loadSheetPlates, MIN_SHEET_PLATES } from "../../shared/sheetPlates.mjs";
import { supabaseAdmin, tenantId } from "./_db.js";
import {
  deleteStoredPhotos,
  droppedStoragePaths,
  expandSpinPatterns,
  isProtectedStoragePath,
  photoUrlsOf,
  safeSlug,
  VEHICLE_PHOTOS_BUCKET,
} from "./_media.js";

const ROW_COLUMNS = "slug,plate,image,gallery,spin,status";
const ROW_COLUMNS_WITHOUT_SPIN = "slug,plate,image,gallery,status";

/**
 * Autos de este tenant cuya patente ya no está en la planilla de Unidades Chile.
 * Una hoja corta o ilegible no devuelve candidatos: no se borra el stock.
 */
export function carsAbsentFromSheet(rows, plates, minPlates = MIN_SHEET_PLATES) {
  if (!(plates instanceof Set) || plates.size < minPlates) return [];
  const absent = [];
  for (const row of rows || []) {
    const plate = plateKey(row?.plate || row?.unidad || "");
    if (!plate || plates.has(plate)) continue;
    if (!safeSlug(row?.slug || row?.id)) continue;
    absent.push(row);
  }
  return absent;
}

/** Fotos y frames 360 de vehicle-photos bajo unidades-chile/<slug>/. */
export function storagePathsForRemovedCar(row) {
  const slug = safeSlug(row?.slug || row?.id);
  if (!slug) return [];
  const urls = [...photoUrlsOf(row), ...expandSpinPatterns(row?.spin)];
  return droppedStoragePaths(urls, [], slug).filter((path) => !isProtectedStoragePath(path));
}

async function loadUcCatalogRows() {
  const reader = supabaseAdmin();
  if (!reader) return null;
  const tenant = await tenantId(reader);
  if (!tenant) return null;
  const first = await reader.from("catalog_vehicles").select(ROW_COLUMNS).eq("tenant_id", tenant);
  if (!first.error) return first.data || [];
  const second = await reader
    .from("catalog_vehicles")
    .select(ROW_COLUMNS_WITHOUT_SPIN)
    .eq("tenant_id", tenant);
  if (second.error) return null;
  return second.data || [];
}

async function unpublishUcVehicle(admin, row) {
  const slug = safeSlug(row?.slug || row?.id);
  if (!slug) throw new Error("Slug inválido.");
  const tenant = await tenantId(admin);
  if (!tenant) throw new Error("Tenant no encontrado.");
  const { error } = await admin.from("catalog_vehicles").delete().eq("tenant_id", tenant).eq("slug", slug);
  if (error) throw new Error(error.message || "No se pudo despublicar.");
}

/**
 * En el mismo sync: saca de la vitrina al auto que ya no está en la planilla
 * y borra de inmediato sus fotos y el tour 360. Solo el bucket vehicle-photos
 * y el prefijo unidades-chile/<slug>/. Boletas y pagos no se tocan.
 */
export async function purgeCarsMissingFromSheet(deps = {}) {
  const minPlates = deps.minPlates ?? MIN_SHEET_PLATES;
  const plates = await (deps.loadPlates || loadSheetPlates)();
  if (!(plates instanceof Set) || plates.size < minPlates) {
    return { ok: true, skipped: true, reason: "planilla ilegible o incompleta", removed: [] };
  }
  const rows = await (deps.loadRows || loadUcCatalogRows)();
  if (!Array.isArray(rows)) {
    return { ok: false, skipped: true, reason: "No se pudo leer el catálogo.", removed: [] };
  }
  const absent = carsAbsentFromSheet(rows, plates, minPlates);
  if (!absent.length) return { ok: true, skipped: false, removed: [] };

  const admin = deps.admin === undefined ? supabaseAdmin() : deps.admin;
  if (!admin) {
    return {
      ok: false,
      skipped: true,
      reason: "Falta SUPABASE_SERVICE_ROLE_KEY para borrar fotos y el tour 360.",
      removed: [],
    };
  }

  const unpublish = deps.unpublish || ((row) => unpublishUcVehicle(admin, row));
  const removed = [];
  for (const row of absent) {
    const slug = safeSlug(row.slug || row.id);
    const plate = plateKey(row.plate || row.unidad);
    try {
      await unpublish(row);
    } catch (err) {
      removed.push({
        slug,
        plate,
        error: err instanceof Error ? err.message : "No se pudo despublicar.",
        storage: null,
      });
      continue;
    }
    const storage = await deleteStoredPhotos(
      {
        paths: storagePathsForRemovedCar(row),
        slug,
        reason: "removed",
        listSlug: true,
      },
      { admin },
    );
    removed.push({ slug, plate, storage });
  }
  const failed = removed.some((row) => row.error || row.storage?.orphanError);
  return { ok: !failed, skipped: false, bucket: VEHICLE_PHOTOS_BUCKET, removed };
}
