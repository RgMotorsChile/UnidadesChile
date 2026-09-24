import { Link } from "react-router-dom";
import { useData } from "../store/DataProvider";
import { isSupabaseConfigured } from "../lib/supabase";
import { catalogStats } from "../lib/stats";
import { Kpi } from "./ui";

export function TelemetryPage() {
  const { vehicles, leads, publications, media, catalogSource, ready } = useData();
  const stats = catalogStats(vehicles);
  const vistas = vehicles.reduce((n, v) => n + (v.vistas || 0), 0);
  const porOrigen = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.origen] = (acc[l.origen] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Telemetría & Salud</h1>
      <p className="mt-1 text-sm text-white/45">
        Visitas locales, leads y estado de la base — tenant Unidades Chile.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Vistas de fichas" value={String(vistas)} hint="Contador de este navegador / vitrina" />
        <Kpi label="Leads" value={String(leads.length)} hint={`${leads.filter((l) => l.estado === "nuevo").length} nuevos`} />
        <Kpi label="Fotos en medios" value={String(media.length)} />
        <Kpi label="Notas del sitio" value={String(publications.length)} hint={`${publications.filter((p) => p.estado === "publicado").length} publicadas`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h2 className="font-semibold">Sistemas</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-white/60">Panel listo</span>
              <span>{ready ? "OK" : "Cargando"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-white/60">Supabase</span>
              <span>{isSupabaseConfigured() ? "Configurado" : "Sin clave"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-white/60">Origen del catálogo</span>
              <span>{catalogSource}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-white/60">Stock publicado</span>
              <span>
                {stats.publicados} / {stats.n}
              </span>
            </li>
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Leads por canal</h2>
            <Link to="/admin/crm" className="text-xs text-brand">
              Abrir CRM →
            </Link>
          </div>
          {porOrigen.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">Aún no hay tráfico comercial en este perfil.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {porOrigen.map(([origen, n]) => (
                <li key={origen} className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="text-white/70">{origen}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
