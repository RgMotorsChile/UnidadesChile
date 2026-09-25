import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useData } from "../store/DataProvider";
import { clp, km } from "../lib/format";
import {
  adminDeleteVehicle,
  adminFetchVehicles,
  adminSaveVehicle,
  adminSellVehicle,
  adminSyncInventory,
} from "../lib/adminApi";
import { SafeImg } from "./ui";
import type { Vehicle, VehicleStatus } from "../store/types";

const FILTERS: { id: "all" | VehicleStatus; label: string }[] = [
  { id: "all", label: "Todos los estados" },
  { id: "publicado", label: "Disponibles" },
  { id: "reservado", label: "En reserva" },
  { id: "vendido", label: "Vendidos" },
  { id: "borrador", label: "Borradores" },
];

function rememberSale(row: { slug: string; plate: string; brand: string; model: string; year: number; salePrice: number; supplier: string }) {
  const key = "uc-sold-history";
  const prev = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
  prev.unshift({ ...row, soldAt: new Date().toISOString(), photosDeleted: true });
  localStorage.setItem(key, JSON.stringify(prev.slice(0, 200)));
}

export function CatalogList() {
  const navigate = useNavigate();
  const { vehicles, refresh, saveVehicle, deleteVehicle } = useData();
  const [remote, setRemote] = useState<Vehicle[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [busy, setBusy] = useState("");
  const [sellTarget, setSellTarget] = useState<Vehicle | null>(null);
  const [selling, setSelling] = useState(false);

  const listSource = remote ?? vehicles;

  const loadRemote = async () => {
    try {
      setRemote(await adminFetchVehicles());
    } catch {
      setRemote(null);
    }
  };

  useEffect(() => {
    void loadRemote();
  }, []);

  const list = useMemo(() => {
    return listSource
      .filter((v) => (status === "all" ? true : v.status === status))
      .filter((v) => {
        const blob = `${v.marca} ${v.modelo} ${v.year} ${v.unidad}`.toLowerCase();
        return blob.includes(q.toLowerCase());
      })
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }, [listSource, q, status]);

  const disponibles = listSource.filter((v) => v.status === "publicado").length;

  const persist = async (v: Vehicle) => {
    try {
      await adminSaveVehicle(v);
    } catch {
      await saveVehicle(v);
    }
    await refresh();
    await loadRemote();
  };

  const quickStatus = async (v: Vehicle, next: VehicleStatus) => {
    if (next === "vendido") {
      setSellTarget(v);
      return;
    }
    setBusy(v.id);
    await persist({ ...v, status: next, updatedAt: new Date().toISOString() });
    setBusy("");
  };

  const confirmSell = async () => {
    if (!sellTarget) return;
    setSelling(true);
    try {
      await adminSellVehicle(sellTarget.id, sellTarget.precio, "Unidades Chile");
      rememberSale({
        slug: sellTarget.id,
        plate: sellTarget.unidad,
        brand: sellTarget.marca,
        model: sellTarget.modelo,
        year: sellTarget.year,
        salePrice: sellTarget.precio,
        supplier: "Unidades Chile",
      });
      await deleteVehicle(sellTarget.id);
      setSellTarget(null);
      await refresh();
      await loadRemote();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSelling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Inventario de Vehículos</h2>
          <p className="text-xs text-white/50">
            {listSource.length} vehículos en base de datos · {disponibles} disponibles
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              setBusy("sync");
              try {
                await adminSyncInventory();
                await refresh();
                await loadRemote();
              } catch (err) {
                alert(err instanceof Error ? err.message : "No se pudo sincronizar.");
              } finally {
                setBusy("");
              }
            }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-300"
          >
            {busy === "sync" ? "Sincronizando…" : "Sincronizar Drive & Excel"}
          </button>
          <Link
            to="/admin/inventario/medios"
            className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-2.5 text-xs font-bold text-brand"
          >
            Gestor de Fotos
          </Link>
          <Link
            to="/admin/inventario/nueva"
            className="rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white"
          >
            + Publicar Vehículo
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#121212] p-3 sm:flex-row sm:items-center">
        <input
          className="field flex-1"
          placeholder="Buscar por marca, modelo o año…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="field w-full sm:w-52"
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof FILTERS)[number]["id"])}
        >
          {FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121212]">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 font-medium">Vehículo</th>
              <th className="px-4 py-3 font-medium">Año / Km</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <SafeImg src={v.imagenes[0] ?? ""} alt="" className="h-11 w-16 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold">
                        {v.marca} {v.modelo}
                      </p>
                      <p className="text-xs text-white/40">
                        {v.version} · {v.unidad}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{v.year}</p>
                  <p className="text-xs text-white/40">{km(v.km)}</p>
                </td>
                <td className="px-4 py-3 font-bold text-brand">{clp(v.precio)}</td>
                <td className="px-4 py-3">
                  <select
                    disabled={busy === v.id}
                    value={v.status}
                    onChange={(e) => void quickStatus(v, e.target.value as VehicleStatus)}
                    className="rounded-lg border border-white/15 bg-black px-2 py-1 text-xs font-semibold"
                  >
                    <option value="publicado">Disponible</option>
                    <option value="reservado">En reserva</option>
                    <option value="vendido">Vendido</option>
                    <option value="borrador">Borrador</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="text-xs text-white/50 hover:text-white"
                      onClick={() => navigate(`/admin/inventario/${v.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-xs text-white/50 hover:text-white"
                      onClick={() => navigate(`/admin/inventario/medios?slug=${encodeURIComponent(v.id)}`)}
                    >
                      Fotos
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-300/80 hover:text-red-200"
                      onClick={async () => {
                        if (!confirm(`¿Eliminar ${v.marca} ${v.modelo} del catálogo?`)) return;
                        try {
                          await adminDeleteVehicle(v.id);
                        } catch {
                          /* local */
                        }
                        await deleteVehicle(v.id);
                        await refresh();
                        await loadRemote();
                      }}
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <p className="px-4 py-8 text-center text-xs text-white/40">
            No se encontraron vehículos con los filtros seleccionados.
          </p>
        )}
      </div>

      {sellTarget && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-5">
            <h3 className="text-lg font-bold">Registrar venta</h3>
            <p className="mt-2 text-sm text-white/60">
              {sellTarget.marca} {sellTarget.modelo} · {clp(sellTarget.precio)}. Se saca de vitrina y queda en el
              historial, como en RG Motors.
            </p>
            <p className="mt-3 text-xs text-white/45">Vendido por: Unidades Chile</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-4 py-2 text-sm text-white/50" onClick={() => setSellTarget(null)}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={selling}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold disabled:opacity-40"
                onClick={() => void confirmSell()}
              >
                {selling ? "Guardando…" : "Confirmar venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
