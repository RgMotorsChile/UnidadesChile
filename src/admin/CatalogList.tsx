import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useData } from "../store/DataProvider";
import { clp, km } from "../lib/format";
import { SafeImg, statusTone } from "./ui";
import type { VehicleStatus } from "../store/types";

const filters: { id: VehicleStatus | "todos"; label: string }[] = [
  { id: "todos", label: "Todas" },
  { id: "publicado", label: "Publicadas" },
  { id: "borrador", label: "Borrador" },
  { id: "reservado", label: "Reservadas" },
  { id: "vendido", label: "Vendidas" },
];

export function CatalogList() {
  const { vehicles } = useData();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]["id"]>("todos");

  const list = useMemo(() => {
    return vehicles
      .filter((v) => (status === "todos" ? true : v.status === status))
      .filter((v) => {
        const blob = `${v.marca} ${v.modelo} ${v.year} ${v.unidad}`.toLowerCase();
        return blob.includes(q.toLowerCase());
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [vehicles, q, status]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-white/45">{vehicles.length} unidades en la base.</p>
        </div>
        <Link
          to="/admin/inventario/nueva"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} />
          Nueva unidad
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-white/35" />
          <input
            className="field pl-9"
            placeholder="Buscar marca, modelo o unidad"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatus(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                status === f.id ? "bg-brand" : "bg-white/5 text-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:hidden">
        {list.map((v) => (
          <Link
            key={v.id}
            to={`/admin/inventario/${v.id}`}
            className="flex gap-3 rounded-2xl border border-white/10 bg-[#121212] p-3"
          >
            <SafeImg src={v.imagenes[0] ?? ""} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" />
            <span className="min-w-0">
              <span className="block font-semibold">
                {v.marca} {v.modelo} {v.year}
              </span>
              <span className="text-xs text-white/40">Unidad {v.unidad}</span>
              <span className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{clp(v.precio)}</span>
                <span className="text-white/45">{km(v.km)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(v.status)}`}>
                  {v.status}
                </span>
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3 font-medium">Unidad</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Km</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Vistas</th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link to={`/admin/inventario/${v.id}`} className="flex items-center gap-3">
                    <SafeImg
                      src={v.imagenes[0] ?? ""}
                      alt=""
                      className="h-12 w-16 rounded-md object-cover"
                    />
                    <span>
                      <span className="block font-semibold">
                        {v.marca} {v.modelo} {v.year}
                      </span>
                      <span className="text-xs text-white/40">Unidad {v.unidad}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">{clp(v.precio)}</td>
                <td className="px-4 py-3 text-white/60">{km(v.km)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(v.status)}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/50">{v.vistas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
