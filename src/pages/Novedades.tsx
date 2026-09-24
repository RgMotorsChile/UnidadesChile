import { Link } from "react-router-dom";
import { useData } from "../store/DataProvider";
import { SafeImg } from "../admin/ui";
import { PageTitle } from "../components/PageTitle";

export function Novedades() {
  const { publications } = useData();
  const posts = publications
    .filter((p) => p.estado === "publicado")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 pb-28 sm:px-6 sm:py-16">
      <PageTitle
        title="Novedades | Unidades Chile"
        description="Notas, llegadas y campañas de Unidades Chile en Puerto Montt."
      />
      <p className="eyebrow">Novedades</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.03em] sm:text-5xl">Del patio</h1>
      <p className="mt-4 max-w-xl text-white/60">Notas, llegadas y campañas de Unidades Chile.</p>

      <div className="mt-10 grid gap-4">
        {posts.map((p) => (
          <Link
            key={p.id}
            to={`/novedades/${p.slug}`}
            className="flex gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-4 hover:border-white/20"
          >
            {p.portada ? (
              <SafeImg src={p.portada} alt="" className="h-24 w-32 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="h-24 w-32 shrink-0 rounded-lg bg-white/5" />
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{p.titulo}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-white/50">{p.extracto}</p>
            </div>
          </Link>
        ))}
        {!posts.length && <p className="text-sm text-white/45">Aún no hay notas publicadas.</p>}
      </div>
    </div>
  );
}
