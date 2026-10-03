import { clp } from "../lib/format";

type SoldRow = {
  slug: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  salePrice: number;
  supplier: string;
  soldAt: string;
  photosDeleted?: boolean;
};

function loadSold(): SoldRow[] {
  try {
    return JSON.parse(localStorage.getItem("uc-sold-history") || "[]") as SoldRow[];
  } catch {
    return [];
  }
}

export function SoldList() {
  const rows = loadSold();

  return (
    <div>
      <h2 className="text-lg font-bold">Historial de vehículos vendidos</h2>
      <p className="mt-1 text-sm text-white/45">
        Solo queda el registro comercial (fecha, hora y quién vendió). Las fotos se eliminan al marcar como vendido.
      </p>
      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">Fecha venta</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Patente</th>
              <th className="px-4 py-3">Precio venta</th>
              <th className="px-4 py-3">Vendido por</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = new Date(r.soldAt);
              return (
                <tr key={`${r.slug}-${r.soldAt}`} className="border-t border-white/5">
                  <td className="px-4 py-3">{d.toLocaleDateString("es-CL")}</td>
                  <td className="px-4 py-3 text-white/60">
                    {d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {r.brand} {r.model} {r.year}
                  </td>
                  <td className="px-4 py-3 font-mono text-white/70">{r.plate}</td>
                  <td className="px-4 py-3 font-bold text-brand">{clp(r.salePrice)}</td>
                  <td className="px-4 py-3">{r.supplier || "Unidades Chile"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 md:hidden">
        {rows.map((r) => (
          <div key={`${r.slug}-${r.soldAt}`} className="rounded-2xl border border-white/10 bg-[#121212] p-4">
            <p className="font-medium">
              {r.brand} {r.model} {r.year}
            </p>
            <p className="mt-1 text-sm text-white/50">
              {r.plate} · {clp(r.salePrice)} · {r.supplier}
            </p>
          </div>
        ))}
      </div>
      {!rows.length && <p className="mt-4 text-sm text-white/40">Aún no hay ventas archivadas.</p>}
    </div>
  );
}
