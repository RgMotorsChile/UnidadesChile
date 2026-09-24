import { useData } from "../store/DataProvider";
import { SafeImg } from "./ui";

export function MediaPage() {
  const { media, uploadFiles, deleteMedia } = useData();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-white/45">Biblioteca de fotos del catálogo, publicaciones y el sitio.</p>
        </div>
        <label className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold">
          Subir archivos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              if (files.length) uploadFiles(files, "sitio");
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {media.map((m) => (
          <figure key={m.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#121212]">
            <SafeImg src={`idb:${m.id}`} alt={m.nombre} className="aspect-square w-full object-cover" />
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-white/45">
              <span className="truncate">{m.nombre}</span>
              <button type="button" className="text-brand" onClick={() => deleteMedia(m.id)}>
                Borrar
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
      {!media.length && <p className="mt-8 text-sm text-white/40">La biblioteca está vacía. Sube fotos desde aquí o desde cada unidad.</p>}
    </div>
  );
}
