import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminFetchVehicles } from "../lib/adminApi";
import { mediaUrlsEqual, normalizeMediaUrl } from "../lib/frontCoverMap";
import { PENDING_PHOTO, isPendingPhoto } from "../lib/photos";
import { useData } from "../store/DataProvider";
import {
  convertImageToWebp,
  formatBytes,
  readApiError,
  uploadPhotosSequentially,
} from "../lib/uploadPhotos";
import type { Vehicle } from "../store/types";

type PhotoItem = { name: string; url: string; size: number; isCover?: boolean };
type StagedPhoto = { id: string; file: File; previewUrl: string; ready: boolean; error?: string };

function revokeAll(items: StagedPhoto[]) {
  for (const s of items) {
    try {
      URL.revokeObjectURL(s.previewUrl);
    } catch {
      /* noop */
    }
  }
}

function galleryFromVehicle(vehicle: Vehicle | null): PhotoItem[] {
  return (vehicle?.imagenes || [])
    .filter((url) => url && !isPendingPhoto(url))
    .map((url) => ({
      name: url.split("/").pop()?.split("?")[0] || url,
      url,
      size: 0,
    }));
}

export function PhotoManager({ initialSlug }: { initialSlug?: string }) {
  const { vehicles: catalogVehicles } = useData();
  const [params, setParams] = useSearchParams();
  const [vehiclesData, setVehiclesData] = useState<Vehicle[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug || params.get("slug") || "");
  const [searchCar, setSearchCar] = useState("");
  const [staged, setStaged] = useState<StagedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<PhotoItem[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = isPreparing || isUploading;

  const selectedVehicle =
    vehiclesData.find((v) => v.id === selectedSlug) || vehiclesData[0] || null;

  const clearStaged = useCallback(() => {
    setStaged((prev) => {
      revokeAll(prev);
      return [];
    });
  }, []);

  const applyVehicleList = useCallback(
    (list: Vehicle[]) => {
      setVehiclesData(list);
      setSelectedSlug((cur) => cur || initialSlug || params.get("slug") || list[0]?.id || "");
    },
    [initialSlug, params],
  );

  const loadVehicles = useCallback(async () => {
    try {
      applyVehicleList(await adminFetchVehicles());
    } catch (err) {
      if (catalogVehicles.length) {
        applyVehicleList(catalogVehicles);
        return;
      }
      setUploadError(err instanceof Error ? err.message : "No se pudo leer el inventario.");
    }
  }, [applyVehicleList, catalogVehicles]);

  const fetchPhotos = useCallback(async (slug: string) => {
    if (!slug) return;
    setIsLoadingPhotos(true);
    const fallback =
      galleryFromVehicle(vehiclesData.find((v) => v.id === slug) || catalogVehicles.find((v) => v.id === slug) || null);
    try {
      const res = await fetch(`/api/admin/photos?slug=${encodeURIComponent(slug)}&_=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        if (fallback.length) {
          setGallery(fallback);
          setCoverImage(fallback[0]?.url || "");
          setUploadError(null);
          return;
        }
        setUploadError(await readApiError(res));
        setGallery([]);
        return;
      }
      const data = (await res.json()) as { gallery?: PhotoItem[]; coverImage?: string };
      const items = Array.isArray(data.gallery) ? data.gallery : [];
      if (items.length) {
        setGallery(items);
        setCoverImage(data.coverImage || items[0]?.url || "");
        setUploadError(null);
        return;
      }
      setGallery(fallback);
      setCoverImage(fallback[0]?.url || data.coverImage || "");
    } catch {
      if (fallback.length) {
        setGallery(fallback);
        setCoverImage(fallback[0]?.url || "");
        return;
      }
      setUploadError("No se pudieron cargar las fotos de esta unidad.");
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [catalogVehicles, vehiclesData]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    if (vehiclesData.length || !catalogVehicles.length) return;
    applyVehicleList(catalogVehicles);
  }, [applyVehicleList, catalogVehicles, vehiclesData.length]);

  useEffect(() => {
    if (!selectedSlug) return;
    setParams((prev) => {
      if (prev.get("slug") === selectedSlug) return prev;
      const next = new URLSearchParams(prev);
      next.set("slug", selectedSlug);
      return next;
    }, { replace: true });
    void fetchPhotos(selectedSlug);
    clearStaged();
    setUploadSuccess(null);
    setUploadProgress(null);
  }, [selectedSlug, fetchPhotos, clearStaged, setParams]);

  useEffect(() => {
    return () => revokeAll(staged);
    // solo al desmontar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesChosen = async (files: FileList | null) => {
    if (!files?.length) return;
    const valid = Array.from(files).filter(
      (f) => /\.(jpe?g|png|webp|avif)$/i.test(f.name) || /^image\//i.test(f.type),
    );
    if (!valid.length) {
      setUploadError("Selecciona imágenes válidas (JPG, PNG o WebP).");
      return;
    }
    setUploadError(null);
    setUploadSuccess(null);
    setIsPreparing(true);
    const draft: StagedPhoto[] = valid.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
      ready: false,
    }));
    setStaged((prev) => [...prev, ...draft]);
    for (let i = 0; i < draft.length; i++) {
      const item = draft[i]!;
      setUploadProgress(`Preparando ${i + 1}/${draft.length}: ${item.file.name}`);
      try {
        const prepared = await convertImageToWebp(item.file);
        const preview = URL.createObjectURL(prepared);
        setStaged((prev) =>
          prev.map((s) => {
            if (s.id !== item.id) return s;
            try {
              URL.revokeObjectURL(s.previewUrl);
            } catch {
              /* noop */
            }
            return { ...s, file: prepared, previewUrl: preview, ready: true };
          }),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No se pudo preparar";
        setStaged((prev) => prev.map((s) => (s.id === item.id ? { ...s, error: msg } : s)));
      }
    }
    setUploadProgress(null);
    setIsPreparing(false);
  };

  const moveStaged = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= staged.length) return;
    setStaged((prev) => {
      const next = [...prev];
      [next[index], next[j]] = [next[j]!, next[index]!];
      return next;
    });
  };

  const handleUploadGallery = async () => {
    const ready = staged.filter((s) => s.ready && !s.error);
    if (!selectedSlug || !ready.length) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadPhotosSequentially({
        slug: selectedSlug,
        type: "cover",
        files: ready.map((s) => s.file),
        onProgress: (p) => setUploadProgress(`Publicando ${p.done + 1}/${p.total}…`),
      });
      setUploadSuccess(result.message);
      clearStaged();
      await fetchPhotos(selectedSlug);
      await loadVehicles();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al publicar.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSetAsCover = async (url: string) => {
    try {
      const res = await fetch("/api/admin/photos", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selectedSlug, action: "set_cover", coverUrl: normalizeMediaUrl(url) }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        alert(data.error || (await readApiError(res)));
        return;
      }
      setUploadSuccess("Portada actualizada: esa foto queda primera en el catálogo.");
      await fetchPhotos(selectedSlug);
      await loadVehicles();
    } catch {
      alert("Error de conexión al actualizar la portada.");
    }
  };

  const handleMovePhoto = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setGallery(next);
    const urls = next.map((g) => normalizeMediaUrl(g.url));
    try {
      const res = await fetch("/api/admin/photos", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selectedSlug, action: "reorder", gallery: urls }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!data.success) await fetchPhotos(selectedSlug);
      else {
        setCoverImage(urls[0] || "");
        await loadVehicles();
      }
    } catch {
      await fetchPhotos(selectedSlug);
    }
  };

  const handleDeletePhoto = async (photo: PhotoItem) => {
    if (!confirm(`¿Eliminar esta foto (${photo.name})?`)) return;
    const res = await fetch("/api/admin/photos", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: selectedSlug, filename: photo.name, url: normalizeMediaUrl(photo.url) }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
    if (!res.ok || !data.success) {
      alert(data.error || "No se pudo eliminar la foto.");
      return;
    }
    await fetchPhotos(selectedSlug);
    await loadVehicles();
  };

  const filtered = vehiclesData.filter((v) => {
    if (!searchCar) return true;
    const q = searchCar.toLowerCase();
    return `${v.unidad} ${v.marca} ${v.modelo}`.toLowerCase().includes(q);
  });
  const readyCount = staged.filter((s) => s.ready && !s.error).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#121212] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <img
            src={coverImage || selectedVehicle?.imagenes[0] || PENDING_PHOTO}
            alt=""
            referrerPolicy="no-referrer"
            className="h-16 w-24 rounded-xl border border-white/10 bg-black object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PENDING_PHOTO;
            }}
          />
          <div>
            <span className="rounded-md border border-brand/40 bg-brand/20 px-2 py-0.5 text-xs font-extrabold tracking-wider text-brand">
              {selectedVehicle?.unidad || "SIN PLACA"}
            </span>
            <h2 className="mt-1 text-xl font-bold">
              {selectedVehicle ? `${selectedVehicle.marca} ${selectedVehicle.modelo} · ${selectedVehicle.year}` : "Elige un vehículo"}
            </h2>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-80">
          <input
            type="search"
            value={searchCar}
            onChange={(e) => setSearchCar(e.target.value)}
            placeholder="Buscar placa, marca o modelo…"
            className="field"
          />
          <select className="field" value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)}>
            {filtered.map((v) => (
              <option key={v.id} value={v.id}>
                [{v.unidad || "—"}] {v.marca} {v.modelo} ({v.year})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-white/40">{filtered.length} en stock</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.2fr]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <div>
            <h3 className="font-semibold">1. Elegir y ordenar fotos</h3>
            <p className="text-xs text-white/50">
              La <span className="text-brand">primera miniatura</span> será la portada. Ordénalas antes de publicar.
            </p>
          </div>
          {staged.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!busy) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (!busy) void handleFilesChosen(e.dataTransfer.files);
              }}
              onClick={() => {
                if (!busy) fileInputRef.current?.click();
              }}
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center ${
                isDragging ? "border-brand bg-brand/15" : "border-white/15 bg-black/40 hover:border-brand/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  void handleFilesChosen(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="text-sm font-medium">Arrastra las fotos aquí o haz clic para explorar</p>
              <p className="mt-1 text-xs text-white/40">JPG, PNG o WebP. Luego ordenas y publicas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white/80">
                  {staged.length} seleccionada{staged.length === 1 ? "" : "s"}
                </p>
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs">
                    + Agregar más
                  </button>
                  <button type="button" disabled={busy} onClick={clearStaged} className="rounded-lg px-3 py-1.5 text-xs text-red-300">
                    Limpiar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {staged.map((item, idx) => (
                  <div key={item.id} className={`overflow-hidden rounded-xl border ${idx === 0 ? "border-brand" : "border-white/10"}`}>
                    <div className="relative aspect-[4/3] bg-black">
                      <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                      {idx === 0 && <span className="absolute left-2 top-2 rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold">PORTADA</span>}
                    </div>
                    <div className="flex items-center justify-between px-1.5 py-1.5 text-[10px]">
                      <div className="flex gap-1">
                        <button type="button" disabled={idx === 0 || busy} onClick={() => moveStaged(idx, -1)} className="rounded bg-white/10 px-1.5">
                          ←
                        </button>
                        <button type="button" disabled={idx === staged.length - 1 || busy} onClick={() => moveStaged(idx, 1)} className="rounded bg-white/10 px-1.5">
                          →
                        </button>
                      </div>
                      <span className="text-white/40">{formatBytes(item.file.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={busy || readyCount === 0}
                onClick={() => void handleUploadGallery()}
                className="w-full rounded-xl bg-brand py-3.5 text-sm font-semibold disabled:opacity-50"
              >
                {isUploading ? uploadProgress || "Publicando…" : `2. Publicar ${readyCount} foto${readyCount === 1 ? "" : "s"} en el catálogo`}
              </button>
            </div>
          )}
          {uploadError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{uploadError}</div>}
          {uploadSuccess && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{uploadSuccess}</div>}
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Fotos ya publicadas</h3>
              <p className="text-xs text-white/50">{gallery.length} en catálogo · ← → cambia el orden · #1 = portada</p>
            </div>
            <button type="button" onClick={() => void fetchPhotos(selectedSlug)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70">
              Refrescar
            </button>
          </div>
          {isLoadingPhotos ? (
            <div className="grid h-48 place-items-center text-xs text-white/40">Cargando fotos del vehículo…</div>
          ) : gallery.length === 0 ? (
            <p className="rounded-xl border border-white/10 p-8 text-center text-sm text-white/50">Aún no hay fotos publicadas para este vehículo.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((photo, idx) => {
                const isCover = idx === 0 || photo.isCover || (coverImage && mediaUrlsEqual(coverImage, photo.url));
                return (
                  <div key={`${photo.url}-${idx}`} className={`overflow-hidden rounded-xl border ${isCover ? "border-brand bg-brand/10" : "border-white/10 bg-black"}`}>
                    <div className="relative aspect-[4/3]">
                      <img
                        src={photo.url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full cursor-zoom-in object-cover"
                        onClick={() => setPreviewImage(photo.url)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PENDING_PHOTO;
                        }}
                      />
                      {isCover && <span className="absolute left-2 top-2 rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold">PORTADA</span>}
                      <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px]">#{idx + 1}</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 text-[10px]">
                      <div className="flex gap-1">
                        <button type="button" disabled={idx === 0} onClick={() => void handleMovePhoto(idx, -1)} className="rounded bg-white/10 px-1.5 disabled:opacity-20">
                          ←
                        </button>
                        <button type="button" disabled={idx === gallery.length - 1} onClick={() => void handleMovePhoto(idx, 1)} className="rounded bg-white/10 px-1.5 disabled:opacity-20">
                          →
                        </button>
                        <button type="button" onClick={() => void handleDeletePhoto(photo)} className="rounded bg-red-500/20 px-1.5 text-red-200">
                          Borrar
                        </button>
                      </div>
                      {isCover ? (
                        <span className="font-bold text-emerald-400">Principal</span>
                      ) : (
                        <button type="button" onClick={() => void handleSetAsCover(photo.url)} className="font-semibold text-brand underline">
                          Poner portada
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {previewImage && (
        <button type="button" className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="" referrerPolicy="no-referrer" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain" />
        </button>
      )}
    </div>
  );
}
