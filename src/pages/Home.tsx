import { Link } from "react-router-dom";
import { Clock3, MapPin, Navigation } from "lucide-react";
import { CarCard } from "../components/CarCard";
import { TrustBar } from "../components/TrustBar";
import { clp, savingsLabel } from "../lib/format";
import { hasRemotePhotos } from "../lib/photos";
import { useData } from "../store/DataProvider";
import { PageTitle } from "../components/PageTitle";
import type { Vehicle } from "../store/types";

function isL200(car: Vehicle) {
  return /l200/i.test(`${car.marca} ${car.modelo} ${car.version}`);
}

export function Home() {
  const { published, settings } = useData();
  const cheapestL200 = published
    .filter((car) => isL200(car) && car.precio > 0)
    .reduce<Vehicle | null>((best, car) => {
      if (!best || car.precio < best.precio) return car;
      return best;
    }, null);
  const l200Ahorro = cheapestL200
    ? savingsLabel(cheapestL200.precio, cheapestL200.mercado)
    : null;
  const withPhotos = published.filter((car) => hasRemotePhotos(car.imagenes));
  const featuredPhotos = withPhotos.filter((c) => c.destacado);
  const rail = (featuredPhotos.length >= 3 ? featuredPhotos : withPhotos).slice(0, 3);
  const railIds = new Set(rail.map((c) => c.id));
  const preview = withPhotos.filter((car) => !railIds.has(car.id)).slice(0, 3);
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(settings.mapQuery)}&z=14&output=embed`;

  return (
    <div className="bg-black">
      <PageTitle
        title="Unidades Chile Automotriz"
        description="Autos seleccionados en Puerto Montt. Precio bajo mercado, inspección 180 puntos y financiamiento Autofin."
      />
      <div className="flex flex-col">
        <section className="relative isolate min-h-[calc(100svh-4.75rem)] overflow-x-clip bg-black">
          <img
            src="/cars/hero-l200.png"
            alt="Mitsubishi L200 roja"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[72%_center] sm:object-[64%_48%] lg:left-auto lg:w-[74%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black from-0% via-black/70 via-[36%] to-transparent to-[72%] lg:via-black/40 lg:via-[20%] lg:to-transparent lg:to-[48%]" />

          <div className="relative mx-auto flex min-h-[calc(100svh-4.75rem)] max-w-[1400px] flex-col justify-end px-4 pb-8 pt-[calc(6.5rem+env(safe-area-inset-top))] sm:px-6 lg:justify-center lg:px-10 lg:pb-0 lg:pt-16">
            <div className="max-w-[min(540px,42vw)] max-lg:max-w-[540px]">
              <p className="text-[13px] font-medium text-white/55">
                {settings.address}
              </p>
              <h1 className="mt-4 break-words text-white">
                <span className="block text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[clamp(34px,3.9vw,54px)]">
                  {settings.homeHeadline1}
                </span>
                <span className="mt-1 block font-display text-[32px] italic leading-[1.14] tracking-[-0.02em] text-white/95 sm:text-[clamp(36px,4.3vw,58px)]">
                  {settings.homeHeadline2}
                </span>
              </h1>
              <p className="mt-5 max-w-[400px] text-[14px] leading-[1.65] tracking-[0.01em] text-white/50 sm:text-[15px]">
                {settings.homeSub}
              </p>
              <div className="mt-7 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap">
                <Link
                  to="/catalogo"
                  className="rounded-full bg-brand px-6 py-2.5 text-center text-[13px] font-medium tracking-[0.02em] text-white hover:bg-brand-dark"
                >
                  Explorar catálogo
                </Link>
                <Link
                  to="/consigna-tu-vehiculo"
                  className="rounded-full border border-white/35 px-6 py-2.5 text-center text-[13px] font-medium tracking-[0.02em] text-white hover:border-white hover:bg-white/5"
                >
                  Consigna tu vehículo
                </Link>
              </div>
              {cheapestL200 && (
                <Link
                  to={`/catalogo/${cheapestL200.id}`}
                  className="mt-7 block w-full max-w-[220px] rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 backdrop-blur-md lg:hidden"
                >
                  <p className="text-[12px] font-medium text-white/55">Mitsubishi L200</p>
                  <p className="mt-1 text-[13px] text-white/45">Desde</p>
                  <p className="text-[22px] font-semibold tracking-[-0.03em] text-white">
                    {clp(cheapestL200.precio)}
                  </p>
                  {l200Ahorro && (
                    <span className="mt-2 inline-flex rounded-full bg-brand/90 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.04em] text-white">
                      {l200Ahorro}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>

          {cheapestL200 && (
            <Link
              to={`/catalogo/${cheapestL200.id}`}
              className="absolute right-5 z-20 hidden w-[min(220px,calc(100%-2rem))] rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 backdrop-blur-md hover:border-white/25 sm:right-10 sm:bottom-[16%] lg:right-[5%] lg:block"
            >
              <p className="text-[12px] font-medium text-white/55">Mitsubishi L200</p>
              <p className="mt-1 text-[13px] text-white/45">Desde</p>
              <p className="text-[22px] font-semibold tracking-[-0.03em] text-white">
                {clp(cheapestL200.precio)}
              </p>
              {l200Ahorro && (
                <span className="mt-2 inline-flex rounded-full bg-brand/90 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.04em] text-white">
                  {l200Ahorro}
                </span>
              )}
            </Link>
          )}
        </section>

        <TrustBar />
      </div>

      <section className="bg-black">
        <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6 lg:px-10 lg:pb-16 lg:pt-5">
          <div>
            <p className="eyebrow">En venta</p>
            <h2 className="mt-2 font-display text-[28px] italic tracking-[-0.02em] text-white sm:text-[36px]">
              Stock disponible
            </h2>
          </div>
          <div className="mt-8 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
            {rail.map((car) => (
              <CarCard key={car.id} car={car} layout="featured" />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preview.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              to="/catalogo"
              className="rounded-full bg-brand px-8 py-3 text-center text-[14px] font-medium text-white hover:bg-brand-dark"
            >
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#070707]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[0.9fr_1.4fr] lg:items-center lg:gap-12 lg:px-10 lg:py-16">
          <div className="min-w-0">
            <p className="eyebrow">Sucursal</p>
            <h2 className="mt-2 font-display text-[28px] italic tracking-[-0.02em] break-words text-white sm:text-[36px]">
              Visítanos en Puerto Montt
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
              Revisa la unidad en persona, cotiza el financiamiento y retira el mismo día.
            </p>
            <ul className="mt-8 space-y-4 text-[15px] text-white">
              <li className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brand" />
                <span>{settings.address}</span>
              </li>
              <li className="flex gap-3">
                <Clock3 size={18} className="mt-0.5 shrink-0 text-brand" />
                <span>{settings.hours}</span>
              </li>
            </ul>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapQuery)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-[10px] border border-white px-5 py-3 text-[14px] font-semibold text-white hover:bg-white/5"
            >
              <Navigation size={16} />
              Cómo llegar
            </a>
          </div>
          <div className="relative min-h-[280px] w-full min-w-0 overflow-hidden rounded-[16px] border border-white/10 sm:min-h-[320px] lg:min-h-[420px]">
            <iframe
              title="Mapa de Unidades Chile"
              src={mapSrc}
              className="absolute inset-0 h-full w-full max-w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
