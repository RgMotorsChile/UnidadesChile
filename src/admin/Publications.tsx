import { useState } from "react";
import { Plus } from "lucide-react";
import { useData } from "../store/DataProvider";
import { nowIso, slugify, uid } from "../store/repo";
import type { Publication } from "../store/types";
import { AdminField, SafeImg, statusTone } from "./ui";

export function PublicationsPage() {
  const { publications, savePublication, deletePublication, uploadFiles } = useData();
  const [editing, setEditing] = useState<Publication | null>(null);

  const blank = (): Publication => ({
    id: uid("post"),
    titulo: "",
    slug: "",
    extracto: "",
    cuerpo: "",
    portada: "",
    estado: "borrador",
    tags: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-white/45">Notas, novedades y campañas del sitio.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold"
          onClick={() => setEditing(blank())}
        >
          <Plus size={16} />
          Nueva publicación
        </button>
      </div>

      {editing && (
        <form
          className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            await savePublication({
              ...editing,
              slug: editing.slug || slugify(editing.titulo),
            });
            setEditing(null);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <AdminField label="Título">
              <input
                className="field"
                value={editing.titulo}
                onChange={(e) => setEditing({ ...editing, titulo: e.target.value })}
              />
            </AdminField>
            <AdminField label="Estado">
              <select
                className="field"
                value={editing.estado}
                onChange={(e) => setEditing({ ...editing, estado: e.target.value as Publication["estado"] })}
              >
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
              </select>
            </AdminField>
          </div>
          <AdminField label="Extracto">
            <input
              className="field mt-1.5"
              value={editing.extracto}
              onChange={(e) => setEditing({ ...editing, extracto: e.target.value })}
            />
          </AdminField>
          <AdminField label="Cuerpo">
            <textarea
              className="field mt-1.5 min-h-[140px]"
              value={editing.cuerpo}
              onChange={(e) => setEditing({ ...editing, cuerpo: e.target.value })}
            />
          </AdminField>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="rounded-full border border-white/15 px-4 py-2 text-sm">
              Subir portada
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const [asset] = await uploadFiles([file], "publicacion");
                  setEditing({ ...editing, portada: `idb:${asset.id}` });
                }}
              />
            </label>
            {editing.portada && <SafeImg src={editing.portada} alt="" className="h-16 w-24 rounded-md object-cover" />}
            <button type="submit" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold">
              Guardar
            </button>
            <button type="button" className="text-sm text-white/40" onClick={() => setEditing(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-3">
        {publications.map((p) => (
          <article key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#121212] p-4">
            {p.portada ? (
              <SafeImg src={p.portada} alt="" className="h-16 w-24 rounded-md object-cover" />
            ) : (
              <div className="h-16 w-24 rounded-md bg-white/5" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.titulo || "Sin título"}</p>
              <p className="truncate text-sm text-white/40">{p.extracto}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(p.estado)}`}>
              {p.estado}
            </span>
            <button type="button" className="text-sm text-white/50" onClick={() => setEditing(p)}>
              Editar
            </button>
            <button type="button" className="text-sm text-white/30" onClick={() => deletePublication(p.id)}>
              Borrar
            </button>
          </article>
        ))}
        {!publications.length && !editing && (
          <p className="text-sm text-white/40">Aún no hay publicaciones. Crea la primera nota del sitio.</p>
        )}
      </div>
    </div>
  );
}
