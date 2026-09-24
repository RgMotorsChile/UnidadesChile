import { useMemo, useState } from "react";
import type { Car } from "../data/cars";
import { waLink } from "../lib/config";
import { newLead } from "../lib/leads";
import { useData } from "../store/DataProvider";

const TIMES = ["10:00", "11:30", "12:30", "15:00", "16:30", "17:30"];

function monthGrid() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return {
    cells,
    monthName: first.toLocaleDateString("es-CL", { month: "long", year: "numeric" }),
    today: now.getDate(),
  };
}

export function TestDrive({ car }: { car: Car }) {
  const { saveLead, settings } = useData();
  const cal = useMemo(() => monthGrid(), []);
  const [day, setDay] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [done, setDone] = useState(false);

  const can = !!(day && time && nombre.trim() && telefono.trim());
  const label = `${car.marca} ${car.modelo} ${car.year}`;

  if (done) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
        <p className="text-lg font-semibold">Prueba agendada</p>
        <p className="mt-2 text-sm text-white/55">
          {day} de {cal.monthName} a las {time} · {label}
        </p>
        <a
          href={waLink(
            `Hola, soy ${nombre}. Agendé prueba de ${label} el ${day} de ${cal.monthName} a las ${time}.`,
            settings.whatsapp,
          )}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-full bg-brand px-4 py-2 text-sm font-medium"
        >
          Confirmar por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
      <p className="eyebrow">Showroom Puerto Montt</p>
      <h2 className="mt-2 text-xl font-semibold">Agendar prueba de manejo</h2>
      <p className="mt-1 text-xs capitalize text-white/40">{cal.monthName}</p>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-white/35">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
        {cal.cells.map((d, i) =>
          d == null ? (
            <span key={`e-${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              disabled={d < cal.today}
              onClick={() => setDay(d)}
              className={`min-h-9 rounded-md py-2 ${}
                d < cal.today
                  ? "text-white/15"
                  : day === d
                    ? "bg-brand text-white"
                    : "text-white/70 hover:bg-white/5"
              }`}
            >
              {d}
            </button>
          ),
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {TIMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTime(t)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              time === t ? "bg-brand" : "bg-white/5 text-white/65"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!can) return;
          void saveLead(
            newLead({
              origen: "prueba-manejo",
              nombre,
              telefono,
              vehicleId: car.id,
              mensaje: `Prueba ${label} el ${day} de ${cal.monthName} a las ${time}.`,
            }),
          );
          setDone(true);
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
        <button
          type="submit"
          disabled={!can}
          className="rounded-xl bg-brand py-3 text-sm font-semibold hover:bg-brand-dark disabled:opacity-40 sm:col-span-2"
        >
          Confirmar prueba
        </button>
      </form>
    </div>
  );
}
