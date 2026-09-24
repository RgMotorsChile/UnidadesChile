import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { clp } from "../lib/format";
import { waLink } from "../lib/config";
import { newLead } from "../lib/leads";
import { useData } from "../store/DataProvider";
import {
  CREDIT_RULES,
  cuotaDesde,
  simulateCredit,
} from "../lib/autofin";
import { PageTitle } from "../components/PageTitle";

export function Financia() {
  const { published, saveLead, settings } = useData();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [monto, setMonto] = useState(15_000_000);
  const [pie, setPie] = useState(CREDIT_RULES.minDownPct);
  const [plazo, setPlazo] = useState(CREDIT_RULES.maxTermMonths);

  const sim = useMemo(
    () => simulateCredit({ price: monto, downPct: pie, termMonths: plazo }),
    [monto, pie, plazo],
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 pb-28 sm:px-6 sm:py-16 lg:px-8">
      <PageTitle
        title="Financia | Unidades Chile"
        description="Simula crédito Autofin con la misma cuota que en sucursal. Pie desde 20% y hasta 48 meses."
      />
      <p className="eyebrow">Crédito Autofin</p>
      <h1 className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
        La misma cuota
        <br />
        que en Autofin.
      </h1>
      <p className="mt-5 max-w-xl text-white/70">
        Motor calibrado contra el simulador de Autofin.cl (API Trinidad: desgravamen +
        cesantía incluidos). La cuota de acá es la misma que verás allá.
      </p>

      <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-2 lg:gap-8">
        <form className="rounded-3xl bg-[#141414] p-5 sm:p-6" onSubmit={(e) => e.preventDefault()}>
          <label className="text-xs text-muted">
            Precio del vehículo
            <input
              type="range"
              min={8_000_000}
              max={45_000_000}
              step={100_000}
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              className="mt-3 w-full accent-brand"
            />
            <p className="mt-2 text-2xl font-semibold">{clp(monto)}</p>
          </label>

          <div className="mt-8">
            <div className="flex justify-between text-xs text-muted">
              <span>Pie ({sim.downPct}%)</span>
              <span className="font-semibold text-white">{clp(sim.downPayment)}</span>
            </div>
            <input
              type="range"
              min={CREDIT_RULES.minDownPct}
              max={CREDIT_RULES.maxDownPct}
              step={5}
              value={pie}
              onChange={(e) => setPie(Number(e.target.value))}
              className="mt-3 w-full accent-brand"
            />
            <p className="mt-2 text-[11px] text-white/40">
              Mínimo Autofin {CREDIT_RULES.minDownPct}%
            </p>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-xs text-muted">
              <span>Plazo</span>
              <span className="font-semibold text-white">{sim.termMonths} meses</span>
            </div>
            <input
              type="range"
              min={CREDIT_RULES.minTermMonths}
              max={CREDIT_RULES.maxTermMonths}
              step={CREDIT_RULES.termStep}
              value={plazo}
              onChange={(e) => setPlazo(Number(e.target.value))}
              className="mt-3 w-full accent-brand"
            />
            <p className="mt-2 text-[11px] text-white/40">
              {CREDIT_RULES.minTermMonths} a {CREDIT_RULES.maxTermMonths} cuotas fijas
            </p>
          </div>
        </form>

        <div className="rounded-3xl border border-brand/40 bg-black p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">
            Cuota mensual referencial
          </p>
          <p className="mt-2 whitespace-nowrap text-3xl font-semibold sm:text-5xl">
            {clp(sim.monthlyPayment)}
          </p>
          <p className="mt-1 text-sm text-white/40">
            Incluye desgravamen y cesantía · CAE ~{sim.caeApprox.toFixed(0)}%
          </p>
          <div className="mt-8 space-y-2 text-sm text-white/75">
            <p>Pie: {clp(sim.downPayment)} ({sim.downPct}%)</p>
            <p>A financiar: {clp(sim.financed)}</p>
            <p>Tasa all-in: {(sim.monthlyRate * 100).toFixed(2).replace(".", ",")}% mensual</p>
            <p>CAE referencial: {sim.caeApprox.toFixed(1).replace(".", ",")}%</p>
            <p>Gastos operacionales: {clp(sim.operationalFees)}</p>
            <p>Total crédito + pie: {clp(sim.totalCostWithDown)}</p>
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-white/40">
            Primera cuota ~{sim.deferredFirstPaymentDays} días. Calibrado contra Autofin.cl
            (API Trinidad). En sucursal la cuota puede confirmarse o ajustarse según
            evaluación.{" "}
            <Link to="/aviso-credito" className="text-white/70 underline underline-offset-2">
              Aviso de crédito
            </Link>
          </p>
          {sim.warnings.map((w) => (
            <p key={w} className="mt-2 text-[12px] text-amber-200/80">
              {w}
            </p>
          ))}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <input
              className="field"
              placeholder="WhatsApp"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <a
            href={waLink(
              `Soy ${nombre || "cliente"}. Quiero financiar ${clp(monto)} a ${sim.termMonths} meses con pie ${sim.downPct}% (${clp(sim.downPayment)}). Cuota Autofin ${clp(sim.monthlyPayment)}. Tel: ${telefono}.`,
              settings.whatsapp,
            )}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              void saveLead(
                newLead({
                  origen: "financia",
                  nombre,
                  telefono,
                  mensaje: `Financiar ${clp(monto)} · pie ${sim.downPct}% · ${sim.termMonths}m · cuota ${clp(sim.monthlyPayment)}`,
                }),
              )
            }
            className="mt-4 inline-flex rounded-full bg-brand px-6 py-3.5 text-sm font-semibold hover:bg-brand-dark"
          >
            Solicitar preaprobación
          </a>
        </div>
      </div>

      <div className="mt-12 sm:mt-16">
        <h2 className="text-2xl font-semibold">Unidades fáciles de financiar</h2>
        <p className="mt-2 text-sm text-white/45">Cuota Autofin con 20% de pie a 48 meses.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {published.slice(0, 3).map((c) => (
            <Link
              key={c.id}
              to={`/catalogo/${c.id}`}
              className="rounded-2xl bg-[#141414] p-4 hover:red-glow"
            >
              <p className="text-lg font-semibold">
                {c.marca} {c.modelo}
              </p>
              <p className="text-sm text-muted">Desde {clp(cuotaDesde(c.precio))} / mes</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
