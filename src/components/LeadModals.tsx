import { useState } from "react";
import { X } from "lucide-react";
import { waLink } from "../lib/config";
import { newLead } from "../lib/leads";
import { clp } from "../lib/format";
import { useData } from "../store/DataProvider";

type Kind = "pedido" | "alerta";

export function LeadModals({
  kind,
  onClose,
  vehicleId,
  vehicleLabel,
}: {
  kind: Kind;
  onClose: () => void;
  vehicleId?: string;
  vehicleLabel?: string;
}) {
  const { saveLead, settings } = useData();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [presupuesto, setPresupuesto] = useState(15_000_000);
  const [sent, setSent] = useState(false);

  const title = kind === "pedido" ? "Auto a pedido" : "Alerta de precio";
  const origen = kind === "pedido" ? "auto-pedido" : "alerta-precio";

  return (
    <div className="fixed inset-0 z-[70] grid items-end bg-black/70 p-0 sm:place-items-center sm:p-4" role="dialog">
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#111] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{kind === "pedido" ? "Te avisamos" : "Ficha"}</p>
            <h2 className="mt-1 text-xl font-semibold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-white/15" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="mt-6">
            <p className="text-white/70">Quedó registrado. Te escribimos cuando haya novedad.</p>
            <a
              href={waLink(
                kind === "pedido"
                  ? `Hola, soy ${nombre}. Busco ${marca} ${modelo}, presupuesto ${clp(presupuesto)}.`
                  : `Hola, soy ${nombre}. Quiero alerta de precio de ${vehicleLabel ?? "una unidad"}.`,
                settings.whatsapp,
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-full bg-brand px-4 py-2 text-sm font-medium"
            >
              Confirmar por WhatsApp
            </a>
          </div>
        ) : (
          <form
            className="mt-5 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void saveLead(
                newLead({
                  origen,
                  nombre,
                  telefono,
                  vehicleId,
                  mensaje:
                    kind === "pedido"
                      ? `Pedido: ${marca} ${modelo}, máx ${clp(presupuesto)}.`
                      : `Alerta de precio: ${vehicleLabel ?? vehicleId}`,
                }),
              );
              setSent(true);
            }}
          >
            <label className="text-xs text-muted">
              Nombre
              <input className="field mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label className="text-xs text-muted">
              WhatsApp
              <input className="field mt-1" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </label>
            {kind === "pedido" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-muted">
                    Marca
                    <input className="field mt-1" value={marca} onChange={(e) => setMarca(e.target.value)} required />
                  </label>
                  <label className="text-xs text-muted">
                    Modelo
                    <input className="field mt-1" value={modelo} onChange={(e) => setModelo(e.target.value)} required />
                  </label>
                </div>
                <label className="text-xs text-muted">
                  Presupuesto máximo
                  <input
                    type="range"
                    min={6_000_000}
                    max={40_000_000}
                    step={500_000}
                    value={presupuesto}
                    onChange={(e) => setPresupuesto(Number(e.target.value))}
                    className="mt-2 w-full accent-brand"
                  />
                  <p className="mt-1 text-sm font-semibold text-white">{clp(presupuesto)}</p>
                </label>
              </>
            )}
            {kind === "alerta" && vehicleLabel && (
              <p className="text-sm text-white/55">{vehicleLabel}</p>
            )}
            <button type="submit" className="mt-1 rounded-xl bg-brand py-3 text-sm font-semibold hover:bg-brand-dark">
              {kind === "pedido" ? "Pedir aviso" : "Activar alerta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
