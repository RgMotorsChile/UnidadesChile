import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageTitle } from "../components/PageTitle";
import { useCompare } from "../components/Compare";
import { SafeImg } from "../admin/ui";
import { clp, km } from "../lib/format";
import { cuotaDesde } from "../lib/autofin";
import { usePublishedCars } from "../store/DataProvider";

export function Comparador() {
  const cars = usePublishedCars();
  const { ids, toggle, setIds, clear } = useCompare();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const fromUrl = params.get("ids")?.split(",").filter(Boolean) ?? [];
    if (fromUrl.length) setIds(fromUrl.slice(0, 3));
  }, []);

  useEffect(() => {
    if (ids.length) setParams({ ids: ids.join(",") }, { replace: true });
    else setParams({}, { replace: true });
  }, [ids, setParams]);

  const selected = ids
    .map((id) => cars.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const available = cars.filter((c) => !ids.includes(c.id));

  const rows = [
    { label: "Precio", get: (i: number) => clp(selected[i].precio) },
    { label: "Precio mercado", get: (i: number) => clp(selected[i].mercado) },
    { label: "Año", get: (i: number) => String(selected[i].year) },
    { label: "Kilometraje", get: (i: number) => km(selected[i].km) },
    { label: "Transmisión", get: (i: number) => selected[i].transmision },
    { label: "Combustible", get: (i: number) => selected[i].combustible },
    { label: "Tracción", get: (i: number) => selected[i].traccion },
    { label: "Carrocería", get: (i: number) => selected[i].carroceria },
    { label: "Dueños", get: (i: number) => String(selected[i].duenos) },
    { label: "Cuota desde", get: (i: number) => `${clp(cuotaDesde(selected[i].precio))} / mes` },
    { label: "Unidad", get: (i: number) => selected[i].unidad },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-28 pt-8 sm:px-6 md:px-8">
      <PageTitle
        title="Comparador | Unidades Chile"
        description="Compara hasta 3 unidades del stock de Unidades Chile en Puerto Montt."
      />
      <p className="eyebrow">Hasta 3 unidades</p>
      <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.03em] sm:text-[48px]">
        Comparador
      </h1>
      <p className="mt-4 max-w-xl text-sm text-white/60">
        Elige autos del catálogo y míralos lado a lado.
      </p>

      {ids.length < 3 && (
        <label className="mt-8 block max-w-md text-[11px] text-white/45">
          Agregar unidad
          <select
            className="field mt-1.5"
            value=""
            onChange={(e) => {
              if (e.target.value) toggle(e.target.value);
            }}
          >
            <option value="">Selecciona un auto</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.marca} {c.modelo} {c.year} · {clp(c.precio)}
              </option>
            ))}
          </select>
        </label>
      )}

      {!selected.length && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-[#141414] p-8 text-center">
          <p className="text-white/60">Todavía no hay unidades para comparar.</p>
          <Link to="/catalogo" className="mt-4 inline-block text-sm text-brand">
            Ir al catálogo
          </Link>
        </div>
      )}

      {selected.length > 0 && (
        <>
          <div className="mt-8 grid gap-4 md:hidden">
            {selected.map((car, i) => (
              <article key={car.id} className="rounded-2xl border border-white/10 bg-[#141414] p-4">
                <div className="car-photo-well aspect-[4/3] overflow-hidden rounded-xl">
                  <SafeImg src={car.imagenes[0]} alt={`${car.marca} ${car.modelo}`} className="h-full w-full object-contain p-3" />
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {car.marca} {car.modelo}
                </p>
                <p className="text-xs text-white/45">{car.year}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  {rows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 border-t border-white/5 pt-2">
                      <dt className="text-white/45">{row.label}</dt>
                      <dd className="text-right font-medium">{row.get(i)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex items-center justify-between">
                  <button type="button" onClick={() => toggle(car.id)} className="text-[11px] text-white/40">
                    Quitar
                  </button>
                  <Link to={`/catalogo/${car.id}`} className="rounded-full bg-brand px-4 py-2 text-[12px] font-medium">
                    Ver ficha
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-36 p-3 text-left align-bottom text-[11px] font-medium uppercase tracking-wider text-white/35">
                    Ficha
                  </th>
                  {selected.map((car) => (
                    <th key={car.id} className="p-3 align-top">
                      <div className="rounded-2xl border border-white/[0.08] bg-[#141414] p-3 text-left">
                        <div className="car-photo-well aspect-[4/3] overflow-hidden rounded-xl">
                          <SafeImg
                            src={car.imagenes[0]}
                            alt={`${car.marca} ${car.modelo}`}
                            className="h-full w-full object-contain p-3"
                          />
                        </div>
                        <p className="mt-3 text-sm font-semibold">
                          {car.marca} {car.modelo}
                        </p>
                        <p className="text-xs text-white/45">{car.year}</p>
                        <p className="mt-1 text-base font-semibold">{clp(car.precio)}</p>
                        <button
                          type="button"
                          onClick={() => toggle(car.id)}
                          className="mt-3 text-[11px] text-white/40 hover:text-white"
                        >
                          Quitar
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <td className="border-t border-white/5 px-3 py-3 text-xs text-white/45">
                      {row.label}
                    </td>
                    {selected.map((car, i) => (
                      <td
                        key={`${row.label}-${car.id}`}
                        className="border-t border-white/5 px-3 py-3 text-sm"
                      >
                        {row.get(i)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="border-t border-white/5 px-3 py-4" />
                  {selected.map((car) => (
                    <td key={`cta-${car.id}`} className="border-t border-white/5 px-3 py-4">
                      <Link
                        to={`/catalogo/${car.id}`}
                        className="inline-flex rounded-full bg-brand px-4 py-2 text-[12px] font-medium"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" onClick={clear} className="mt-6 text-xs text-white/40 hover:text-white">
            Limpiar comparación
          </button>
        </>
      )}
    </div>
  );
}
