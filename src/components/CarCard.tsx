import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { Car } from "../data/cars";
import { clp, km, savingsLabel } from "../lib/format";
import { useFavorites } from "./Favorites";
import { useCompare } from "./Compare";
import { SafeImg } from "../admin/ui";

type Props = {
  car: Car;
  layout?: "grid" | "featured";
};

function PhotoWell({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`car-photo-well relative overflow-hidden ${className}`}>
      <SafeImg
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain object-center p-4 transition duration-700 ease-out group-hover:scale-[1.015] sm:p-5"
      />
    </div>
  );
}

export function CarCard({ car, layout = "grid" }: Props) {
  const { has, toggle } = useFavorites();
  const compare = useCompare();
  const saved = has(car.id);
  const compared = compare.has(car.id);
  const badge = savingsLabel(car.precio, car.mercado);
  const alt = `${car.marca} ${car.modelo}`;

  if (layout === "featured") {
    return (
      <article className="group relative h-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414]">
        <span className="absolute inset-x-0 top-0 z-10 h-px bg-brand/80" />
        <Link
          to={`/catalogo/${car.id}`}
          className="grid h-full grid-cols-1 sm:grid-cols-[minmax(8.75rem,0.82fr)_minmax(0,1.28fr)]"
        >
          <div className="flex min-w-0 flex-col justify-center px-3.5 py-4 sm:px-4 sm:py-5">
            <h3 className="line-clamp-2 min-h-[2.5em] text-[14px] font-semibold leading-tight text-white">
              {car.marca} {car.modelo} {car.year}
            </h3>
            <p className="mt-2 whitespace-nowrap text-[17px] font-semibold tracking-tight text-white sm:mt-3 sm:text-[19px]">
              {clp(car.precio)}
            </p>
            <p className="mt-1 text-[12px] text-white/45">{km(car.km)}</p>
          </div>
          <PhotoWell src={car.imagenes[0]} alt={alt} className="aspect-[4/3] sm:aspect-auto sm:min-h-[188px]" />
        </Link>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)] transition duration-500 hover:-translate-y-0.5 hover:border-white/16">
      <Link to={`/catalogo/${car.id}`} className="block">
        <PhotoWell src={car.imagenes[0]} alt={alt} className="aspect-[4/3] w-full" />
      </Link>
      <button
        type="button"
        onClick={() => {
          if (!compare.toggle(car.id) && !compared) {
            window.alert("Puedes comparar hasta 3 unidades.");
          }
        }}
        className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm ${
          compared ? "bg-brand text-white" : "bg-black/35 text-white/90"
        }`}
      >
        {compared ? "En comparador" : "Comparar"}
      </button>
      <button
        type="button"
        onClick={() => toggle(car.id)}
        className="absolute right-3 top-3 z-10 rounded-full bg-black/35 p-1.5 text-white/90 backdrop-blur-sm sm:right-3.5 sm:top-3.5"
        aria-label={saved ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart size={16} strokeWidth={1.6} className={saved ? "fill-brand text-brand" : ""} />
      </button>
      <Link
        to={`/catalogo/${car.id}`}
        className="flex flex-1 flex-col border-t border-white/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4"
      >
        <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug sm:text-[17px]">
          {car.marca} {car.modelo}
        </h3>
        <p className="mt-1 text-[12px] text-white/45 sm:text-[13px]">
          {car.year} · {km(car.km)}
        </p>
        <p className="mt-auto pt-2 text-[20px] font-semibold tracking-tight sm:pt-3 sm:text-[24px]">
          {clp(car.precio)}
        </p>
        <span
          className={`mt-2 inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            badge ? "bg-brand text-white" : "invisible"
          }`}
        >
          {badge || "—"}
        </span>
      </Link>
    </article>
  );
}
