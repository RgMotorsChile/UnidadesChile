import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Fuel, Gauge, MapPin, Printer, Settings2, User, Waypoints } from "lucide-react";
import { clp, km } from "../lib/format";
import { cuotaDesde } from "../lib/autofin";
import { waLink } from "../lib/config";
import { newLead } from "../lib/leads";
import { WhatsAppIcon } from "../components/Header";
import { PageTitle } from "../components/PageTitle";
import { TestDrive } from "../components/TestDrive";
import { LeadModals } from "../components/LeadModals";
import { useCompare } from "../components/Compare";
import { SafeImg } from "../admin/ui";
import { useData } from "../store/DataProvider";

export function Auto() {
  const { id } = useParams();
  const { published, bumpViews, saveLead, settings } = useData();
  const car = id ? published.find((v) => v.id === id) : undefined;
  const [shot, setShot] = useState(0);
  const [alerta, setAlerta] = useState(false);
  const compare = useCompare();

  useEffect(() => {
    if (id) void bumpViews(id);
  }, [id, bumpViews]);

  if (!car) {
    return (
      <div className="px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold">Unidad no encontrada</h1>
        <Link to="/catalogo" className="mt-6 inline-block text-brand">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const ahorro = car.mercado - car.precio;
  const specs = [
    { icon: Gauge, label: km(car.km) },
    { icon: Settings2, label: car.transmision },
    { icon: Fuel, label: car.combustible },
    { icon: Waypoints, label: car.traccion },
    { icon: User, label: `${car.duenos} dueño` },
    { icon: MapPin, label: car.ciudad },
  ];
  const msg = `Hola, quiero reservar la unidad ${car.unidad}: ${car.marca} ${car.modelo} ${car.year}.`;
  const visitMsg = `Quiero agendar visita para ${car.marca} ${car.modelo} ${car.year} (unidad ${car.unidad}).`;
  const track = (origen: string, mensaje: string) => {
    void saveLead(newLead({ origen, mensaje, vehicleId: car.id, nombre: `${car.marca} ${car.modelo}` }));
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-28 pt-5 sm:px-6 md:px-8">
      <PageTitle
        title={`${car.marca} ${car.modelo} ${car.year} | Unidades Chile`}
        description={`${car.marca} ${car.modelo} ${car.year} en Puerto Montt. ${clp(car.precio)}. Unidad ${car.unidad}.`}
      />
      <p className="text-xs text-white/40 sm:text-sm">
        <Link to="/catalogo" className="hover:text-white">Catálogo</Link>
        {" / "}
        {car.carroceria}
        {" / "}
        <span className="text-brand">{car.marca} {car.modelo}</span>
      </p>

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div className="relative overflow-hidden rounded-[16px] bg-black sm:rounded-[20px]">
          <div className="absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-brand/35 to-transparent sm:h-40" />
          <div className="neon-line absolute bottom-[12%] left-[8%] z-10 hidden w-[70%] sm:block" />
          <div className="absolute bottom-3 left-1/2 z-20 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 gap-2 overflow-x-auto px-1 sm:left-4 sm:top-5 sm:bottom-auto sm:max-w-none sm:translate-x-0 sm:flex-col sm:overflow-visible">
            {car.imagenes.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setShot(i)}
                className={`h-12 w-14 overflow-hidden rounded-md border sm:h-14 sm:w-16 ${
                  i === shot ? "border-brand" : "border-white/20"
                }`}
              >
                <SafeImg src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <SafeImg
            src={car.imagenes[shot]}
            alt={`${car.marca} ${car.modelo}`}
            className="aspect-[16/11] w-full object-cover object-center"
          />
        </div>

        <div>
          <p className="eyebrow">
            Unidad {car.unidad} · {car.certificado ? "Certificada" : "En revisión"}
          </p>
          <h1 className="mt-3 break-words text-[28px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[40px] md:text-[52px]">
            {car.marca} {car.modelo}
            <span className="mt-1 block text-[18px] text-white/80 sm:text-[28px]">
              {car.version} {car.year}
            </span>
          </h1>
          <p className="mt-5 break-words text-[28px] font-semibold tracking-tight sm:mt-6 sm:text-[40px]">{clp(car.precio)}</p>
          <div className="mt-3 rounded-md bg-brand px-3 py-2 text-[12px] font-semibold sm:px-4 sm:py-2.5 sm:text-sm">
            Precio mercado {clp(car.mercado)} → ahorras {clp(ahorro)}
          </div>

          <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 sm:grid-cols-3">
            {specs.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex min-w-0 items-center gap-2 border-t border-r border-white/10 px-3 py-3 text-[12px] last:border-r-0 even:border-r-0 sm:border-r sm:px-4 sm:py-4 sm:text-sm sm:even:border-r sm:[&:nth-child(3n)]:border-r-0 sm:[&:nth-child(-n+3)]:border-t-0 [&:nth-child(-n+2)]:border-t-0"
              >
                <Icon size={16} className="shrink-0 text-white" />
                <span className="min-w-0 break-words">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            <a
              href={waLink(msg, settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("reserva", msg)}
              className="rounded-lg bg-brand px-5 py-3.5 text-center text-sm font-semibold hover:bg-brand-dark"
            >
              Reservar con $200.000
            </a>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <a
                href={waLink(visitMsg, settings.whatsapp)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("visita", visitMsg)}
                className="rounded-lg border border-white/30 px-5 py-3.5 text-center text-sm font-semibold"
              >
                Agendar visita
              </a>
              <a
                href={waLink(msg, settings.whatsapp)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("whatsapp", msg)}
                className="grid h-12 w-12 place-items-center self-center rounded-full bg-brand"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium">Inspección 180 puntos</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Array.from({ length: 11 }).map((_, i) => (
                <span
                  key={i}
                  className={`grid h-7 w-7 place-items-center rounded-full text-[10px] ${
                    i === 10 ? "bg-brand" : "bg-white/12"
                  }`}
                >
                  ✓
                </span>
              ))}
            </div>
          </div>

          <p className="mt-8 text-[20px] font-semibold sm:text-[22px]">
            Desde {clp(cuotaDesde(car.precio))}{" "}
            <span className="text-base font-normal text-white/45">/ mes · pie 20% · 48 cuotas</span>
          </p>
          <div className="mt-2 h-px w-36 bg-brand" />
          <Link to="/financia" className="mt-3 inline-block text-sm text-brand">
            Simular financiamiento
          </Link>
          <p className="mt-3 text-[11px] text-white/35">
            Referencial.{" "}
            <Link to="/aviso-credito" className="underline underline-offset-2">
              Aviso de crédito
            </Link>
            {" · "}
            <Link to="/condiciones-reserva" className="underline underline-offset-2">
              Condiciones de reserva
            </Link>
          </p>

          <div className="no-print mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!compare.toggle(car.id) && !compare.has(car.id)) {
                  window.alert("Puedes comparar hasta 3 unidades.");
                }
              }}
              className="rounded-full border border-white/20 px-3 py-1.5 text-[12px] hover:border-white"
            >
              {compare.has(car.id) ? "Quitar del comparador" : "Agregar al comparador"}
            </button>
            <button
              type="button"
              onClick={() => setAlerta(true)}
              className="rounded-full border border-white/20 px-3 py-1.5 text-[12px] hover:border-white"
            >
              Alerta de precio
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[12px] hover:border-white"
            >
              <Printer size={12} />
              Imprimir ficha
            </button>
          </div>
        </div>
      </div>

      <div className="no-print mt-10 max-w-xl">
        <TestDrive car={car} />
      </div>

      {alerta && (
        <LeadModals
          kind="alerta"
          vehicleId={car.id}
          vehicleLabel={`${car.marca} ${car.modelo} ${car.year}`}
          onClose={() => setAlerta(false)}
        />
      )}
    </div>
  );
}
