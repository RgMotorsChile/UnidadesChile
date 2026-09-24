import { useData } from "../store/DataProvider";
import { catalogStats, downloadText, vehiclesToCsv } from "../lib/stats";
import { clp, km } from "../lib/format";
import { exportBackup } from "../store/repo";
import { BarList, Kpi } from "./ui";

export function ReportsPage() {
  const { vehicles, publications, leads } = useData();
  const stats = catalogStats(vehicles);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analítica & Reportes</h1>
          <p className="mt-1 text-sm text-white/45">
            Dataset listo para Excel, Python o R. Cada fila es una unidad con ahorro vs mercado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold"
            onClick={() => downloadText(`catalogo-${new Date().toISOString().slice(0, 10)}.csv`, vehiclesToCsv(vehicles), "text/csv")}
          >
            Exportar CSV
          </button>
          <button
            type="button"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm"
            onClick={async () => {
              const dump = await exportBackup();
              downloadText(`backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(dump, null, 2), "application/json");
            }}
          >
            Backup JSON
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="N" value={String(stats.n)} hint="Filas del dataset" />
        <Kpi label="Precio promedio" value={clp(stats.precioPromedio)} />
        <Kpi label="Km promedio" value={km(Math.round(stats.kmPromedio))} />
        <Kpi label="Publicaciones / leads" value={`${publications.length} / ${leads.length}`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h2 className="mb-4 font-semibold">Carrocería</h2>
          <BarList rows={stats.porCarroceria} />
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h2 className="mb-4 font-semibold">Año del auto</h2>
          <BarList rows={stats.porAnio.map((r) => ({ label: String(r.year), n: r.n }))} />
        </section>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">N</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Precio medio</th>
              <th className="px-4 py-3">Ahorro %</th>
            </tr>
          </thead>
          <tbody>
            {stats.porMarca.map((r) => (
              <tr key={r.marca} className="border-t border-white/5">
                <td className="px-4 py-3 font-medium">{r.marca}</td>
                <td className="px-4 py-3">{r.n}</td>
                <td className="px-4 py-3">{clp(r.valor)}</td>
                <td className="px-4 py-3">{clp(r.precioPromedio)}</td>
                <td className="px-4 py-3">{r.ahorroPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
