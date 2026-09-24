import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { marcas } from "../data/cars";
import { clp } from "../lib/format";
import { waLink } from "../lib/config";
import { newLead } from "../lib/leads";
import { useData } from "../store/DataProvider";
import { PageTitle } from "../components/PageTitle";

const years = Array.from({ length: 16 }, (_, i) => 2026 - i);

export function Vende() {
  const { saveLead, settings } = useData();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [patente, setPatente] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [year, setYear] = useState("");
  const [kms, setKms] = useState("");
  const [asked, setAsked] = useState(false);

  const offer = useMemo(() => {
    if (!asked || !year || !kms) return null;
    const y = Number(year);
    const k = Number(kms.replace(/\./g, ""));
    if (!y || !k) return null;
    const base = 11_500_000 + (y - 2012) * 420_000 - Math.min(k, 180000) * 18;
    const min = Math.max(2_800_000, Math.round(base * 0.94));
    const max = Math.round(base * 1.05);
    return { min, max };
  }, [asked, year, kms]);

  return (
    <div className="relative overflow-x-clip pb-28">
      <PageTitle
        title="Vende tu auto | Unidades Chile"
        description="Te compramos el auto hoy en Puerto Montt. Oferta en 15 minutos y pago al instante."
      />
      <div className="absolute inset-0 bg-[url('/cars/bg-vende.png')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/55" />

      <div className="relative mx-auto grid max-w-[1280px] items-start gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <div className="pt-1 sm:pt-4">
          <h1 className="text-[32px] font-semibold leading-[0.95] tracking-[-0.03em] sm:text-[40px] lg:text-6xl">
            Te compramos
            <br />
            el auto. Hoy.
          </h1>
          <p className="mt-5 text-base text-white/75 sm:text-lg">
            Oferta en 15 minutos. Pago al instante. Sin vueltas.
          </p>
          <ol className="mt-8 space-y-6 sm:mt-10">
            {[
              ["01", "Datos del auto", "Cuéntanos los detalles."],
              ["02", "Oferta real", "Te damos una oferta justa en 15 minutos."],
              ["03", "Pago el mismo día", "Transferimos al instante. Así de simple."],
            ].map(([n, t, d], i) => (
              <li key={n} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-bold">
                    {n}
                  </span>
                  {i < 2 && <span className="mt-1 h-8 w-px bg-white/20" />}
                </div>
                <div>
                  <p className="text-lg font-semibold sm:text-xl">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <form
          className="rounded-3xl border border-brand/50 bg-black/70 p-5 shadow-[0_0_50px_rgba(255,12,64,0.18)] backdrop-blur sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setAsked(true);
            void saveLead(
              newLead({
                origen: "tasacion",
                nombre,
                telefono,
                mensaje: `Tasar ${marca || "auto"} ${modelo} ${year}, patente ${patente}, ${kms} km.`,
              }),
            );
          }}
        >
          <h2 className="text-2xl font-semibold">Tasa tu unidad</h2>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-muted">
                Nombre
                <input
                  className="field mt-1"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </label>
              <label className="text-xs text-muted">
                WhatsApp
                <input
                  className="field mt-1"
                  placeholder="9 1234 5678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="text-xs text-muted">
              Patente
              <input
                className="field mt-1"
                placeholder="Ej: ABCD12"
                value={patente}
                onChange={(e) => setPatente(e.target.value.toUpperCase())}
              />
            </label>
            <label className="text-xs text-muted">
              Marca
              <select className="field mt-1" value={marca} onChange={(e) => setMarca(e.target.value)}>
                <option value="">Selecciona</option>
                {marcas.map((m) => (
                  <option key={m}>{m}</option>
                ))}
                <option>Otra</option>
              </select>
            </label>
            <label className="text-xs text-muted">
              Modelo
              <input
                className="field mt-1"
                placeholder="Ej: CX-5"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-muted">
                Año
                <select className="field mt-1" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Año</option>
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted">
                Kilometraje
                <input
                  className="field mt-1"
                  placeholder="Ej: 85.000"
                  value={kms}
                  onChange={(e) => setKms(e.target.value)}
                />
              </label>
            </div>
            <button type="submit" className="rounded-xl bg-brand py-3.5 font-semibold hover:bg-brand-dark">
              Obtener oferta
            </button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted">
              <Lock size={12} /> Sin compromiso · 100% confidencial
            </p>
          </div>

          {offer && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black p-5">
              <p className="text-sm text-muted">Oferta estimada</p>
              <p className="mt-2 text-xl font-semibold sm:text-2xl">
                {clp(offer.min)} — {clp(offer.max)}
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-brand" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>Monto mínimo</span>
                <span>Monto máximo</span>
              </div>
              <a
                href={waLink(
                  `Soy ${nombre || "cliente"}. Quiero vender ${marca || "mi auto"} ${modelo} ${year}, patente ${patente}, ${kms} km. Tel: ${telefono}.`,
                  settings.whatsapp,
                )}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  void saveLead(
                    newLead({
                      origen: "tasacion-whatsapp",
                      nombre,
                      telefono,
                      mensaje: `Confirmar venta ${marca} ${modelo} ${year}, patente ${patente}.`,
                    }),
                  )
                }
                className="mt-5 block rounded-xl border border-white/20 py-3 text-center text-sm font-semibold hover:border-white"
              >
                Confirmar por WhatsApp
              </a>
            </div>
          )}
        </form>
      </div>

      <div className="relative border-t border-white/5 bg-black/80">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-4 py-5 text-sm text-white/70 sm:gap-6 sm:px-6 lg:px-8">
          <span className="text-brand">● Transferencia el mismo día</span>
          {["Bci", "Banco de Chile", "Santander", "Scotiabank", "Itaú", "Security"].map((b) => (
            <span key={b} className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
