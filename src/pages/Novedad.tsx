import { Link, useParams } from "react-router-dom";
import { useData } from "../store/DataProvider";
import { SafeImg } from "../admin/ui";

export function Novedad() {
  const { slug } = useParams();
  const { publications } = useData();
  const post = publications.find((p) => p.slug === slug && p.estado === "publicado");

  if (!post) {
    return (
      <div className="px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">Nota no encontrada</h1>
        <Link to="/novedades" className="mt-6 inline-block text-brand">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-[720px] px-4 py-10 pb-28 sm:px-6 sm:py-16">
      <Link to="/novedades" className="text-sm text-white/45 hover:text-white">
        ← Novedades
      </Link>
      {post.portada && (
        <SafeImg src={post.portada} alt="" className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover" />
      )}
      <h1 className="mt-6 text-[32px] font-semibold tracking-[-0.03em] sm:text-5xl">{post.titulo}</h1>
      <p className="mt-4 text-lg text-white/55">{post.extracto}</p>
      <div className="mt-8 whitespace-pre-wrap text-[16px] leading-relaxed text-white/80">{post.cuerpo}</div>
    </article>
  );
}
