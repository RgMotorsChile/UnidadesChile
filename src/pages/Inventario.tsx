import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CarCard } from "../components/CarCard";
import { PageTitle } from "../components/PageTitle";
import { LeadModals } from "../components/LeadModals";
import { useCompare } from "../components/Compare";
import { CarFront, Cog, Gauge, Layers } from "lucide-react";
import { Emblem } from "../components/Logo";
import { usePublishedCars } from "../store/DataProvider";

type Sort = "ahorro" | "precio-asc" | "precio-desc" | "km";

export function Inventario() {
  const cars = usePublishedCars();
  const marcas = [...new Set(cars.map((c) => c.marca))].sort();
  const modelos = [...new Set(cars.map((c) => c.modelo))].sort();
  const years = [...new Set(cars.map((c) => c.year))].sort((a, b) => b - a);
  const carrocerias = [...new Set(cars.map((c) => c.carroceria))];
  const combustibles = [...new Set(cars.map((c) => c.combustible))];
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [year, setYear] = useState("");
  const [carroceria, setCarroceria] = useState("");
  const [combustible, setCombustible] = useState("");
  const [transmision, setTransmision] = useState("");
  const [traccion, setTraccion] = useState("");
  const [sort, setSort] = useState<Sort>("ahorro");
  const [pedido, setPedido] = useState(false);
  const compare = useCompare();

  const list = useMemo(() => {
    const filtered = cars.filter((c) => {
      if (marca && c.marca !== marca) return false;
      if (modelo && c.modelo !== modelo) return false;
      if (year && String(c.year) !== year) return false;
      if (carroceria && c.carroceria !== carroceria) return false;
      if (combustible && c.combustible !== combustible) return false;
      if (transmision && c.transmision !== transmision) return false;
      if (traccion && c.traccion !== traccion) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "precio-asc") return a.precio - b.precio;
      if (sort === "precio-desc") return b.precio - a.precio;
      if (sort === "km") return a.km - b.km;
      return b.mercado - b.precio - (a.mercado - a.precio);
    });
  }, [marca, modelo, year, carroceria, combustible, transmision, traccion, sort]);

  return (
    <div className="relative mx-auto max-w-[1280px] px-4 pb-28 pt-8 sm:px-6 md:px-8">
      <PageTitle
        title="Catálogo | Unidades Chile"
        description="Stock de Unidades Chile en Puerto Montt. Pickups, furgones y livianos seleccionados."
      />
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-none tracking-[-0.03em] sm:text-[48px] md:text-[64px]">
            Catálogo
          </h1>
          <p className="eyebrow mt-2 sm:mt-3">
            Stock en Puerto Montt
          </p>
        </div>
        <div className="text-right">
          <p className="text-[28px] font-semibold leading-none sm:text-[48px] md:text-[64px]">{list.length}</p>
          <p className="mt-1 text-[11px] text-white/45 sm:text-sm">unidades disponibles</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 rounded-[14px] bg-[#141414] p-3 sm:grid-cols-3 sm:p-4 lg:flex lg:flex-wrap lg:items-end">
        <Field label="Marca">
          <select value={marca} onChange={(e) => setMarca(e.target.value)} className="field">
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Modelo">
          <select value={modelo} onChange={(e) => setModelo(e.target.value)} className="field">
            <option value="">Todos</option>
            {modelos.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Año">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="field">
            <option value="">Todos</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </Field>
        <Field label="Combustible">
          <select value={combustible} onChange={(e) => setCombustible(e.target.value)} className="field">
            <option value="">Todos</option>
            {combustibles.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Ordenar por">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field">
            <option value="ahorro">Mejor precio vs mercado</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
            <option value="km">Menor kilometraje</option>
          </select>
        </Field>
        {carroceria && (
          <button
            type="button"
            onClick={() => setCarroceria("")}
            className="self-end rounded-md bg-brand px-3 py-2 text-xs font-semibold"
          >
            {carroceria} ×
          </button>
        )}
      </div>

      <div className="mt-5 space-y-2 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["", ...carrocerias].map((c) => (
            <button
              key={c || "todas"}
              type="button"
              onClick={() => setCarroceria(c)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                carroceria === c ? "bg-brand" : "bg-[#141414] text-white/70"
              }`}
            >
              {c || "Todas"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["", "Automático", "Manual"].map((c) => (
            <button
              key={c || "t-todas"}
              type="button"
              onClick={() => setTransmision(c)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                transmision === c ? "bg-brand" : "bg-[#141414] text-white/70"
              }`}
            >
              {c || "Caja"}
            </button>
          ))}
          {["", "4x2", "4x4"].map((c) => (
            <button
              key={`tr-${c || "todas"}`}
              type="button"
              onClick={() => setTraccion(c)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                traccion === c ? "bg-brand" : "bg-[#141414] text-white/70"
              }`}
            >
              {c || "Tracción"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[190px_1fr] lg:gap-8">
        <aside className="hidden space-y-3 lg:block">
          <Side icon={CarFront} title="Carrocería" value={carroceria} onChange={setCarroceria} options={carrocerias} />
          <Side icon={Cog} title="Transmisión" value={transmision} onChange={setTransmision} options={["Automático", "Manual"]} />
          <Side icon={Gauge} title="Tracción" value={traccion} onChange={setTraccion} options={["4x2", "4x4"]} />
          <Side icon={Layers} title="Marca" value={marca} onChange={setMarca} options={marcas} />
        </aside>

        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {list.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#141414] px-4 py-5 text-center">
        <p className="text-sm text-white/60">¿No está lo que buscas?</p>
        <button
          type="button"
          onClick={() => setPedido(true)}
          className="rounded-full bg-brand px-4 py-2 text-[12px] font-medium"
        >
          Pedir un auto
        </button>
      </div>

      {compare.ids.length > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full border border-white/10 bg-black/90 px-4 py-2.5 backdrop-blur md:bottom-8">
          <p className="text-[12px] text-white/70">{compare.ids.length} de 3 en el comparador</p>
          <div className="flex gap-2">
            <button type="button" onClick={compare.clear} className="text-[11px] text-white/40">
              Limpiar
            </button>
            <Link to="/comparador" className="rounded-full bg-brand px-3 py-1.5 text-[12px] font-medium">
              Comparar
            </Link>
          </div>
        </div>
      )}

      {pedido && <LeadModals kind="pedido" onClose={() => setPedido(false)} />}

      <Emblem className="fixed bottom-[5.75rem] right-3 z-40 hidden h-10 w-10 sm:block md:bottom-8 md:right-8 md:h-12 md:w-12" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0 flex-1 text-[11px] text-white/45">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Side({
  icon: Icon,
  title,
  value,
  onChange,
  options,
}: {
  icon: typeof CarFront;
  title: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="rounded-[12px] bg-[#141414] p-4">
      <p className="mb-3 flex items-center gap-2 text-[13px] font-medium">
        <Icon size={15} className="text-brand" />
        {title}
      </p>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`text-left text-[13px] ${value === "" ? "text-white" : "text-white/40"}`}
        >
          Todas
        </button>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`text-left text-[13px] ${value === o ? "text-brand" : "text-white/40 hover:text-white"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
