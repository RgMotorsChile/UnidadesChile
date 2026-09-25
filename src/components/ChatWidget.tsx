import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { clp } from "../lib/format";
import { waLink } from "../lib/config";
import { newLead } from "../lib/leads";
import { useData } from "../store/DataProvider";
import { WhatsAppIcon } from "./Header";

type Msg = { role: "user" | "ai"; text: string; ids?: string[] };

function reply(q: string, cars: { id: string; marca: string; modelo: string; year: number; precio: number; carroceria: string }[]) {
  const t = q.toLowerCase();
  if (/hola|buenas|hey/.test(t)) {
    return { text: "Hola. ¿Buscas pickup, furgón o algo más chico? También puedo pasarte con un ejecutivo." };
  }
  if (/financia|cuota|crédito|credito|pie/.test(t)) {
    return { text: "En /financia simulas tu cuota con el método Autofin. Es referencial: no es la cuota real; en la mayoría de los casos esa puede ser menor." };
  }
  if (/vende|tasar|compran|consign/.test(t)) {
    return { text: "En /consigna-tu-vehiculo dejas los datos y fotos del auto. Nos llega un correo y te contactamos." };
  }
  if (/dónde|donde|dirección|direccion|sucursal|mapa/.test(t)) {
    return { text: "Estamos en Regimiento #1207, Puerto Montt. Lun a Sáb de 10:00 a 19:00." };
  }
  const hit = cars.filter((c) => {
    const blob = `${c.marca} ${c.modelo} ${c.carroceria}`.toLowerCase();
    return t.split(/\s+/).some((w) => w.length > 3 && blob.includes(w));
  });
  if (/pickup|camioneta|4x4|hilux|l200|ranger|navara|dmax/.test(t) || hit.length) {
    const list = (hit.length ? hit : cars.filter((c) => c.carroceria === "Pickup")).slice(0, 3);
    if (list.length) {
      return {
        text: "Estas unidades encajan. Ábrela o escríbenos por WhatsApp para reservar.",
        ids: list.map((c) => c.id),
      };
    }
  }
  return {
    text: `Hay ${cars.length} unidades en nuestro catálogo. Dime marca, presupuesto o escríbenos por WhatsApp.`,
  };
}

export function ChatWidget() {
  const { pathname } = useLocation();
  const { published, settings, saveLead } = useData();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hola, soy el asistente de Unidades Chile. ¿Qué auto estás buscando?" },
  ]);

  const pageCar = useMemo(() => {
    const m = pathname.match(/^\/catalogo\/([^/?#]+)/);
    return m?.[1] ? published.find((c) => c.id === m[1]) : undefined;
  }, [pathname, published]);

  if (pathname.startsWith("/admin")) return null;

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const ans = reply(q, published);
    setMsgs((prev) => [...prev, { role: "user", text: q }, { role: "ai", ...ans }]);
    setInput("");
    if (/whatsapp|ejecutivo|humano/.test(q.toLowerCase())) {
      void saveLead(newLead({ origen: "chat", mensaje: q, vehicleId: pageCar?.id }));
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 z-40 md:bottom-8 md:left-8">
      {open && (
        <div className="pointer-events-auto mb-3 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Unidades Chile</p>
              <p className="text-[11px] text-white/40">Asistente · Puerto Montt</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-white/40" aria-label="Cerrar chat">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4">
            {pageCar && (
              <p className="text-[11px] text-white/35">
                Estás viendo {pageCar.marca} {pageCar.modelo} {pageCar.year}
              </p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <p
                  className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === "user" ? "bg-brand text-white" : "bg-white/10 text-white/80"
                  }`}
                >
                  {m.text}
                </p>
                {m.ids?.length ? (
                  <div className="mt-2 space-y-1 text-left">
                    {m.ids.map((id) => {
                      const c = published.find((x) => x.id === id);
                      if (!c) return null;
                      return (
                        <Link
                          key={id}
                          to={`/catalogo/${id}`}
                          className="block rounded-xl border border-white/10 px-3 py-2 text-[12px] hover:border-white/25"
                        >
                          {c.marca} {c.modelo} · {clp(c.precio)}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              className="field !py-2 text-sm"
              placeholder="Escribe tu consulta"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="rounded-xl bg-brand px-3 text-sm font-semibold">
              Enviar
            </button>
          </form>
          <a
            href={waLink(
              pageCar
                ? `Hola, quiero info de ${pageCar.marca} ${pageCar.modelo} ${pageCar.year}.`
                : "Hola, quiero hablar con un ejecutivo de Unidades Chile.",
              settings.whatsapp,
            )}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 border-t border-white/10 py-2.5 text-[12px] text-white/60 hover:text-white"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Hablar con un ejecutivo
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-[0_10px_30px_rgba(255,12,64,0.35)]"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
      </button>
    </div>
  );
}
