import { TrustBar } from "../components/TrustBar";
import { PageTitle } from "../components/PageTitle";

export function Nosotros() {
  return (
    <div className="pb-28">
      <PageTitle
        title="Nosotros | Unidades Chile"
        description="Automotora de usados en Puerto Montt. Precio bajo mercado e inspección 180 puntos."
      />
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <p className="eyebrow">La automotora</p>
        <h1 className="mt-4 max-w-3xl text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
          Una automotora que compite por precio.
          <br />
          Y gana por transparencia.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          Unidades Chile nace para que comprar un auto usado deje de ser una apuesta.
          Curamos cada unidad, publicamos el precio de mercado y nos comprometemos
          con una inspección de 180 puntos antes de entregar las llaves.
        </p>
      </section>

      <TrustBar />

      <section className="mx-auto grid max-w-[1280px] gap-6 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-3 lg:px-8">
        {[
          ["Selección", "No publicamos todo lo que llega. Solo lo que pasaríamos a un amigo."],
          ["Precio bajo mercado", "Cada ficha muestra el ahorro real frente al valor de mercado."],
          ["Postventa", "90 días de garantía y acompañamiento en el financiamiento."],
        ].map(([t, d]) => (
          <article key={t} className="rounded-2xl bg-[#141414] p-6">
            <div className="mb-4 h-1 w-10 bg-brand" />
            <h2 className="text-2xl font-semibold">{t}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{d}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
