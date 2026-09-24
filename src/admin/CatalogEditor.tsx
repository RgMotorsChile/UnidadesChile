import { useEffect, useState, type DragEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImagePlus, Star, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useData } from "../store/DataProvider";
import { nowIso, uid } from "../store/repo";
import { cuotaDesde } from "../lib/autofin";
import type { Vehicle, VehicleStatus } from "../store/types";
import { AdminField, SafeImg } from "./ui";

const empty = (): Vehicle => ({
  id: "",
  unidad: "",
  marca: "",
  modelo: "",
  version: "",
  year: new Date().getFullYear(),
  precio: 0,
  mercado: 0,
  km: 0,
  transmision: "Automático",
  combustible: "Bencina",
  traccion: "4x2",
  duenos: 1,
  carroceria: "SUV",
  ciudad: "Puerto Montt",
  destacado: false,
  certificado: true,
  cuota: 0,
  imagenes: [],
  status: "borrador",
  notas: "",
  vistas: 0,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

export function CatalogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, saveVehicle, deleteVehicle, uploadFiles } = useData();
  const existing = vehicles.find((v) => v.id === id);
  const isNew = id === "nueva";
  const [form, setForm] = useState<Vehicle>(empty());
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (existing) setForm(existing);
    else if (isNew) {
      const next = String(vehicles.length + 1).padStart(3, "0");
      setForm({ ...empty(), unidad: next });
    }
  }, [existing, isNew, vehicles.length]);

  const set = <K extends keyof Vehicle>(key: K, value: Vehicle[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
    await addPhotos(files);
  };

  const addPhotos = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    const assets = await uploadFiles(files, "catalogo");
    setForm((f) => ({ ...f, imagenes: [...f.imagenes, ...assets.map((a) => `idb:${a.id}`)] }));
    setBusy(false);
  };

  const movePhoto = (index: number, dir: -1 | 1) => {
    const next = [...form.imagenes];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    set("imagenes", next);
  };

  const canSave = form.marca && form.modelo && form.precio > 0;

  return (
    <form
      className="max-w-5xl"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSave) return;
        const payload: Vehicle = {
          ...form,
          id: form.id || `${form.marca}-${form.modelo}-${form.year}`.toLowerCase().replace(/\s+/g, "-") + "-" + uid("u").slice(-6),
          cuota: form.cuota || cuotaDesde(form.precio),
        };
        await saveVehicle(payload);
        navigate("/admin/inventario");
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/inventario" className="text-xs text-white/40 hover:text-white">
            ← Inventario
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{isNew ? "Nueva unidad" : `${form.marca} ${form.modelo}`}</h1>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <button
              type="button"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/60"
              onClick={async () => {
                if (!confirm("¿Eliminar esta unidad?")) return;
                await deleteVehicle(form.id);
                navigate("/admin/inventario");
              }}
            >
              Eliminar
            </button>
          )}
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Fotos</h2>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragOver ? "border-brand bg-brand/10" : "border-white/15 bg-[#121212]"
          }`}
        >
          <ImagePlus className="mb-3 text-brand" />
          <p className="font-semibold">Arrastra fotos aquí o haz clic para elegir</p>
          <p className="mt-1 text-sm text-white/40">JPG, PNG o WEBP. La primera foto es la portada del catálogo.</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              addPhotos(files);
              e.target.value = "";
            }}
          />
        </label>
        {busy && <p className="mt-2 text-sm text-white/45">Subiendo fotos…</p>}
        {form.imagenes.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.imagenes.map((src, i) => (
              <div key={src + i} className="group relative overflow-hidden rounded-xl bg-black">
                <SafeImg src={src} alt="" className="aspect-[4/3] w-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold">
                    <Star size={10} /> Portada
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/70 py-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => movePhoto(i, -1)} className="rounded p-1 hover:bg-white/10">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => movePhoto(i, 1)} className="rounded p-1 hover:bg-white/10">
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => set("imagenes", form.imagenes.filter((_, j) => j !== i))}
                    className="rounded p-1 hover:bg-white/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <AdminField label="Marca">
          <input className="field" value={form.marca} onChange={(e) => set("marca", e.target.value)} />
        </AdminField>
        <AdminField label="Modelo">
          <input className="field" value={form.modelo} onChange={(e) => set("modelo", e.target.value)} />
        </AdminField>
        <AdminField label="Versión">
          <input className="field" value={form.version} onChange={(e) => set("version", e.target.value)} />
        </AdminField>
        <AdminField label="Año">
          <input className="field" type="number" value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
        </AdminField>
        <AdminField label="Precio (CLP)">
          <input className="field" type="number" value={form.precio || ""} onChange={(e) => set("precio", Number(e.target.value))} />
        </AdminField>
        <AdminField label="Precio de mercado (CLP)">
          <input className="field" type="number" value={form.mercado || ""} onChange={(e) => set("mercado", Number(e.target.value))} />
        </AdminField>
        <AdminField label="Kilometraje">
          <input className="field" type="number" value={form.km || ""} onChange={(e) => set("km", Number(e.target.value))} />
        </AdminField>
        <AdminField label="Patente / N° unidad">
          <input className="field" value={form.unidad} onChange={(e) => set("unidad", e.target.value)} />
        </AdminField>
        <AdminField label="Transmisión">
          <select className="field" value={form.transmision} onChange={(e) => set("transmision", e.target.value as Vehicle["transmision"])}>
            <option>Automático</option>
            <option>Manual</option>
          </select>
        </AdminField>
        <AdminField label="Combustible">
          <select className="field" value={form.combustible} onChange={(e) => set("combustible", e.target.value as Vehicle["combustible"])}>
            <option>Bencina</option>
            <option>Diésel</option>
            <option>Híbrido</option>
          </select>
        </AdminField>
        <AdminField label="Tracción">
          <select className="field" value={form.traccion} onChange={(e) => set("traccion", e.target.value as Vehicle["traccion"])}>
            <option>4x2</option>
            <option>4x4</option>
          </select>
        </AdminField>
        <AdminField label="Carrocería">
          <select className="field" value={form.carroceria} onChange={(e) => set("carroceria", e.target.value as Vehicle["carroceria"])}>
            <option>SUV</option>
            <option>Sedán</option>
            <option>Hatchback</option>
            <option>Pickup</option>
            <option>Crossover</option>
            <option>Furgón</option>
          </select>
        </AdminField>
        <AdminField label="Dueños">
          <input className="field" type="number" value={form.duenos} onChange={(e) => set("duenos", Number(e.target.value))} />
        </AdminField>
        <AdminField label="Ciudad">
          <input className="field" value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
        </AdminField>
        <AdminField label="Estado">
          <select className="field" value={form.status} onChange={(e) => set("status", e.target.value as VehicleStatus)}>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="reservado">Reservado</option>
            <option value="vendido">Vendido</option>
          </select>
        </AdminField>
        <AdminField label="Cuota Autofin (vacío = pie 20% · 48m)">
          <input className="field" type="number" value={form.cuota || ""} onChange={(e) => set("cuota", Number(e.target.value))} />
        </AdminField>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.destacado} onChange={(e) => set("destacado", e.target.checked)} />
          Destacada en home
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.certificado} onChange={(e) => set("certificado", e.target.checked)} />
          Certificada 180 puntos
        </label>
      </div>

      <AdminField label="Notas internas">
        <textarea
          className="field mt-1.5 min-h-[100px]"
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
        />
      </AdminField>
    </form>
  );
}
