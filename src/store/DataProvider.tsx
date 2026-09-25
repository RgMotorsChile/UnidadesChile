import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cars } from "../data/cars";
import { SITE } from "../lib/config";
import { fetchUcCatalogFromSupabase } from "../lib/catalogSupabase";
import { PENDING_PHOTO, isRemotePhoto } from "../lib/photos";
import { isSupabaseConfigured } from "../lib/supabase";
import { adminDeleteVehicle, adminSaveVehicle } from "../lib/adminApi";
import { filterToSheetPlates, fetchSheetPlates } from "../lib/sheetPlates";
import { isUnidadesChileStock, plateKey } from "../lib/sources";

const seedByPlate = new Map(cars.map((car) => [plateKey(car.unidad), car]));

function hydratePhotos(list: Vehicle[]): Vehicle[] {
  return list.map((car) => {
    const hasReal = car.imagenes.some((src) => isRemotePhoto(src));
    if (hasReal) return car;
    const local = seedByPlate.get(plateKey(car.unidad));
    if (local?.imagenes?.length) return { ...car, imagenes: local.imagenes };
    return { ...car, imagenes: [PENDING_PHOTO] };
  });
}
import {
  getSettings,
  leadsRepo,
  mediaRepo,
  publicationsRepo,
  saveSettings,
  seedIfNeeded,
  vehiclesRepo,
} from "./repo";
import type { Lead, MediaAsset, Publication, SiteSettings, Vehicle } from "./types";

const seedVehicles: Vehicle[] = cars.map((car) => ({
  ...car,
  status: "publicado" as const,
  notas: "",
  vistas: 0,
  createdAt: "",
  updatedAt: "",
}));

type DataCtx = {
  ready: boolean;
  vehicles: Vehicle[];
  publications: Publication[];
  leads: Lead[];
  media: MediaAsset[];
  settings: SiteSettings;
  published: Vehicle[];
  catalogSource: "supabase" | "local";
  refresh: () => Promise<void>;
  saveVehicle: (v: Vehicle) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  savePublication: (p: Publication) => Promise<void>;
  deletePublication: (id: string) => Promise<void>;
  saveLead: (l: Lead) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  uploadFiles: (files: File[], kind: MediaAsset["kind"]) => Promise<MediaAsset[]>;
  deleteMedia: (id: string) => Promise<void>;
  updateSettings: (s: SiteSettings) => Promise<void>;
  bumpViews: (id: string) => Promise<void>;
};

const Ctx = createContext<DataCtx | null>(null);

const fallbackSettings: SiteSettings = {
  ...SITE,
  homeHeadline1: "El precio justo.",
  homeHeadline2: "El auto que quieres.",
  homeSub: "Autos seleccionados. Precios bajo mercado. Entrega en todo Chile.",
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>(seedVehicles);
  const [catalogSource, setCatalogSource] = useState<"supabase" | "local">("local");
  const [publications, setPublications] = useState<Publication[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [settings, setSettingsState] = useState<SiteSettings>(fallbackSettings);

  const refresh = useCallback(async () => {
    let remote: Vehicle[] | null = null;
    if (isSupabaseConfigured()) {
      remote = await fetchUcCatalogFromSupabase();
    }

    const [v, p, l, m, s, plates] = await Promise.all([
      vehiclesRepo.all(),
      publicationsRepo.all(),
      leadsRepo.all(),
      mediaRepo.all(),
      getSettings(),
      fetchSheetPlates(),
    ]);

    if (remote !== null) {
      setVehicles(hydratePhotos(filterToSheetPlates(remote, plates)));
      setCatalogSource("supabase");
    } else if (v.length) {
      setVehicles(
        hydratePhotos(
          filterToSheetPlates(
            v.filter((car) => isUnidadesChileStock(car.unidad)),
            plates,
          ),
        ),
      );
      setCatalogSource("local");
    }
    setPublications(p);
    setLeads(l);
    setMedia(m);
    setSettingsState(s);
    setReady(true);
  }, []);

  useEffect(() => {
    seedIfNeeded().then(refresh).catch(console.error);
  }, [refresh]);

  const published = useMemo(
    () => vehicles.filter((v) => v.status === "publicado" && isUnidadesChileStock(v.unidad)),
    [vehicles],
  );

  const value = useMemo<DataCtx>(
    () => ({
      ready,
      vehicles,
      publications,
      leads,
      media,
      settings,
      published,
      catalogSource,
      refresh,
      saveVehicle: async (v) => {
        await vehiclesRepo.save(v);
        try {
          await adminSaveVehicle(v);
        } catch {
          /* IDB queda; el API pide cookie + service role */
        }
        await refresh();
      },
      deleteVehicle: async (id) => {
        try {
          await adminDeleteVehicle(id);
        } catch {
          /* local */
        }
        await vehiclesRepo.remove(id);
        await refresh();
      },
      savePublication: async (p) => {
        await publicationsRepo.save(p);
        await refresh();
      },
      deletePublication: async (id) => {
        await publicationsRepo.remove(id);
        await refresh();
      },
      saveLead: async (l) => {
        await leadsRepo.save(l);
        await refresh();
      },
      deleteLead: async (id) => {
        await leadsRepo.remove(id);
        await refresh();
      },
      uploadFiles: async (files, kind) => {
        const out: MediaAsset[] = [];
        for (const file of files) out.push(await mediaRepo.putFile(file, kind));
        await refresh();
        return out;
      },
      deleteMedia: async (id) => {
        await mediaRepo.remove(id);
        await refresh();
      },
      updateSettings: async (s) => {
        await saveSettings(s);
        await refresh();
      },
      bumpViews: async (id) => {
        if (catalogSource === "supabase") {
          setVehicles((prev) =>
            prev.map((x) => (x.id === id ? { ...x, vistas: x.vistas + 1 } : x)),
          );
          return;
        }
        const v = vehicles.find((x) => x.id === id);
        if (!v) return;
        await vehiclesRepo.save({ ...v, vistas: v.vistas + 1 });
      },
    }),
    [ready, vehicles, publications, leads, media, settings, published, catalogSource, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData debe usarse dentro de DataProvider");
  return ctx;
}

export function usePublishedCars() {
  const { published } = useData();
  return published;
}
