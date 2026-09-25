import { Link } from "react-router-dom";
import { useData } from "../store/DataProvider";
import { catalogStats } from "../lib/stats";
import { clp } from "../lib/format";
import { PLACEHOLDER_WHATSAPP } from "../lib/config";
import { countByOrigins } from "./crmViews";
import { BarList, Kpi } from "./ui";

export function AdminDashboard() {
  const { vehicles, leads, publications, settings, catalogSource } = useData();
  const stats = catalogStats(vehicles);
  const nuevos = leads.filter((l) => l.estado === "nuevo").length;
  const reservas = countByOrigins(leads, ["reserva"]);
  const creditos = countByOrigins(leads, ["financia", "credito"]);
  const waPendiente = settings.whatsapp === PLACEHOLDER_WHATSAPP;
  const recientes = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const destacados = vehicles.filter((v) => v.status === "publicado").slice(0, 4);

  return (
    <div>
      <p className="text-sm text-white/45">
        Resumen gerencial de inventario, prospectos y reservas · catálogo {catalogSource === "supabase" ? "remoto" : "local"}.
      </p>

      {waPendiente && (
        <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          El WhatsApp todavía es de prueba. Cámbialo en{" "}
          <Link to="/admin/config" className="underline">
            Configuración
          </Link>
          .
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Vehículos en catálogo" value={String(stats.n)} hint={`${stats.publicados} publicados`} />
        <Kpi label="Solicitudes / reservas" value={String(reservas)} hint={`${nuevos} leads nuevos`} />
        <Kpi label="Valorización de vitrina" value={clp(stats.valorInventario)} hint={`Mediana ${clp(stats.precioMediana)}`} />
        <Kpi label="Disponibles" value={String(stats.publicados)} hint={`${stats.reservados} reservados · ${stats.vendidos} vendidos`} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Accesos rápidos</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/admin/inventario" className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-brand/40">
            <p className="text-xs font-bold">Catálogo & fotos</p>
            <p className="text-[11px] text-white/45">Publicar o editar autos</p>
          </Link>
          <Link to="/admin/crm" className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-brand/40">
            <p className="text-xs font-bold">Centro comercial</p>
            <p className="text-[11px] text-white/45">{leads.length} leads · {creditos} créditos</p>
          </Link>
          <Link to="/admin/crm/reservas" className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-brand/40">
            <p className="text-xs font-bold">Reservas</p>
            <p className="text-[11px] text-white/45">{reservas} solicitudes</p>
          </Link>
          <Link to="/admin/telemetria" className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-brand/40">
            <p className="text-xs font-bold">Telemetría & salud</p>
            <p className="text-[11px] text-white/45">{publications.filter((p) => p.estado === "publicado").length} notas publicadas</p>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Últimas solicitudes</h2>
            <Link to="/admin/crm" className="text-xs text-brand">
              Ver CRM →
            </Link>
          </div>
          {recientes.length === 0 ? (
            <p className="text-sm text-white/40">Sin leads todavía.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recientes.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 border-b border-white/5 pb-2">
                  <div>
                    <p className="font-medium">{l.nombre}</p>
                    <p className="text-[11px] text-white/40">{l.origen}</p>
                  </div>
                  <span className="text-[11px] text-white/50">{l.estado}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Inventario destacado</h2>
            <Link to="/admin/inventario" className="text-xs text-brand">
              Gestionar →
            </Link>
          </div>
          {destacados.length === 0 ? (
            <p className="text-sm text-white/40">Sin unidades publicadas.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {destacados.map((v) => (
                <li key={v.id} className="flex justify-between gap-3">
                  <span className="truncate font-medium">
                    {v.marca} {v.modelo}
                  </span>
                  <span className="text-white/50">{clp(v.precio)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5">
            <BarList rows={stats.porMarca.map((r) => ({ label: r.marca, n: r.n }))} />
          </div>
        </section>
      </div>
    </div>
  );
}
