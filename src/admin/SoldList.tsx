import { Link } from "react-router-dom";
import { useData } from "../store/DataProvider";
import { clp } from "../lib/format";

export function SoldList() {
  const { vehicles } = useData();
  const sold = vehicles.filter((v) => v.status === "vendido");

  return (
    <div>
      <p className="text-sm text-white/45">{sold.length} unidades marcadas como vendidas.</p>
      <div className="mt-4 grid gap-3 md:hidden">
        {sold.map((v) => (
          <Link
            key={v.id}
            to={`/admin/inventario/${v.id}`}
            className="rounded-2xl border border-white/10 bg-[#121212] p-4"
          >
            <p className="font-medium">
              {v.marca} {v.modelo} {v.year}
            </p>
            <p className="mt-1 text-sm text-white/50">
              {v.unidad} · {clp(v.precio)}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Patente</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sold.map((v) => (
              <tr key={v.id} className="border-t border-white/5">
                <td className="px-4 py-3 font-medium">
                  {v.marca} {v.modelo} {v.year}
                </td>
                <td className="px-4 py-3 text-white/60">{v.unidad}</td>
                <td className="px-4 py-3">{clp(v.precio)}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/inventario/${v.id}`} className="text-xs text-brand">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!sold.length && <p className="mt-4 text-sm text-white/40">No hay ventas registradas en este catálogo.</p>}
    </div>
  );
}
