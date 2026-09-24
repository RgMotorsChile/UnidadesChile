import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageTitle } from "../components/PageTitle";
import { useData } from "../store/DataProvider";
import { clp } from "../lib/format";

function Shell({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6">
      <PageTitle title={`${title} | Unidades Chile`} description={description} />
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
        {title}
      </h1>
      <article className="mt-8 space-y-6 rounded-2xl border border-white/[0.08] bg-[#141414] p-5 text-sm leading-relaxed text-white/65 sm:p-8">
        {children}
      </article>
    </div>
  );
}

function H({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold text-white">{children}</h2>;
}

export function Privacidad() {
  const { settings } = useData();
  return (
    <Shell
      title="Política de Privacidad"
      eyebrow="Ley N° 19.628"
      description="Política de privacidad de Unidades Chile conforme a la Ley N° 19.628."
    >
      <section className="space-y-2">
        <H>1. Responsable</H>
        <p>
          El responsable del tratamiento es <strong className="text-white">{settings.legal}</strong>,
          con domicilio en {settings.address}. Contacto:{" "}
          <a href={`mailto:${settings.email}`} className="text-brand hover:underline">
            {settings.email}
          </a>
          .
        </p>
      </section>
      <section className="space-y-2">
        <H>2. Datos que recopilamos</H>
        <p>
          Nombre, teléfono, correo, datos del vehículo de interés, simulación de crédito,
          tasación, prueba de manejo y mensajes que envíes por formularios o WhatsApp.
          También preferencias del navegador (favoritos, comparador y cookies).
        </p>
      </section>
      <section className="space-y-2">
        <H>3. Finalidad</H>
        <p>
          Atender consultas, coordinar visitas o pruebas de manejo, cotizar financiamiento y
          mejorar la atención comercial. No vendemos tus datos a terceros.
        </p>
      </section>
      <section className="space-y-2">
        <H>4. Derechos</H>
        <p>
          Puedes solicitar acceso, corrección o eliminación escribiendo a {settings.email}.
          También puedes reclamar ante SERNAC (
          <a href="https://www.sernac.cl" target="_blank" rel="noreferrer" className="text-brand hover:underline">
            sernac.cl
          </a>
          ).
        </p>
      </section>
      <section className="space-y-2">
        <H>5. Cookies</H>
        <p>
          Ver la{" "}
          <Link to="/cookies" className="text-brand hover:underline">
            Política de Cookies
          </Link>
          . Última actualización: septiembre 2026.
        </p>
      </section>
    </Shell>
  );
}

export function Terminos() {
  const { settings } = useData();
  return (
    <Shell
      title="Términos de Uso"
      eyebrow="Sitio y catálogo"
      description="Términos y condiciones de uso del sitio de Unidades Chile."
    >
      <section className="space-y-2">
        <H>1. Aceptación</H>
        <p>Al usar este sitio aceptas estos términos. Si no estás de acuerdo, no envíes formularios.</p>
      </section>
      <section className="space-y-2">
        <H>2. Identidad</H>
        <p>
          El sitio es operado por <strong className="text-white">{settings.legal}</strong>,{" "}
          {settings.address}. {settings.email} · {settings.phoneDisplay}.
        </p>
      </section>
      <section className="space-y-2">
        <H>3. Catálogo</H>
        <p>
          Precios, kilometraje, fotos y disponibilidad son referenciales y pueden cambiar.
          El catálogo publicado es exclusivo de Unidades Chile Automotriz. La
          disponibilidad se confirma solo con el equipo comercial.
        </p>
      </section>
      <section className="space-y-2">
        <H>4. Usados y garantía</H>
        <p>
          Los vehículos se venden en el estado inspeccionado. Revisa la unidad y la
          documentación en sucursal antes de comprar.
        </p>
      </section>
      <section className="space-y-2">
        <H>5. Solicitudes online</H>
        <p>
          Reserva, crédito, tasación o prueba de manejo son solicitudes de atención, no un
          contrato. Ver{" "}
          <Link to="/condiciones-reserva" className="text-brand hover:underline">
            condiciones de reserva
          </Link>
          .
        </p>
      </section>
      <section className="space-y-2">
        <H>6. Financiamiento</H>
        <p>
          Unidades Chile comercializa el auto. El crédito lo evalúa Autofin u otra financiera.
          Ver{" "}
          <Link to="/aviso-credito" className="text-brand hover:underline">
            Aviso de Crédito
          </Link>
          .
        </p>
      </section>
      <section className="space-y-2">
        <H>7. Ley aplicable</H>
        <p>
          Se rigen por las leyes de Chile. Competencia: tribunales de Puerto Montt, sin
          perjuicio de SERNAC. Última actualización: septiembre 2026.
        </p>
      </section>
    </Shell>
  );
}

export function Cookies() {
  const { settings } = useData();
  return (
    <Shell
      title="Política de Cookies"
      eyebrow="Sitio web"
      description="Uso de cookies en el sitio de Unidades Chile."
    >
      <section className="space-y-2">
        <H>1. Qué son</H>
        <p>Archivos pequeños que el sitio guarda en tu navegador para funcionar y recordar preferencias.</p>
      </section>
      <section className="space-y-2">
        <H>2. Las que usamos</H>
        <p>
          Esenciales: acceso admin, consentimiento y comparador/favoritos. Opcionales:
          origen de visita para mejorar la atención, solo si aceptas.
        </p>
      </section>
      <section className="space-y-2">
        <H>3. Cómo gestionarlas</H>
        <p>
          Puedes aceptar solo esenciales desde el aviso, o borrarlas en tu navegador.
          Consultas: {settings.email}. Ver{" "}
          <Link to="/privacidad" className="text-brand hover:underline">
            Privacidad
          </Link>
          .
        </p>
      </section>
    </Shell>
  );
}

export function AvisoCredito() {
  const { settings } = useData();
  return (
    <Shell
      title="Aviso de Crédito"
      eyebrow="Ley N° 19.496 · SERNAC"
      description="Descargo legal sobre simulaciones de crédito automotriz referenciales."
    >
      <section className="space-y-2">
        <H>1. Simulador</H>
        <p>
          En{" "}
          <Link to="/financia" className="text-brand hover:underline">
            /financia
          </Link>{" "}
          mostramos una cuota referencial calibrada contra Autofin (pie 20–60%, hasta 48
          meses). No es oferta vinculante ni pre-aprobación.
        </p>
      </section>
      <section className="space-y-2">
        <H>2. Evaluación</H>
        <p>
          Tasa, pie, plazo y aprobación los define Autofin u otra entidad según tu
          evaluación crediticia.
        </p>
      </section>
      <section className="space-y-2">
        <H>3. Protección al consumidor</H>
        <p>
          Ante dudas o reclamos: {settings.email} o{" "}
          <a href="https://www.sernac.cl" target="_blank" rel="noreferrer" className="text-brand hover:underline">
            sernac.cl
          </a>
          .
        </p>
      </section>
      <section className="space-y-2">
        <H>4. Rol de Unidades Chile</H>
        <p>
          Comercializamos el vehículo. El crédito, si se otorga, es un contrato entre tú y
          la financiera. Última actualización: septiembre 2026.
        </p>
      </section>
    </Shell>
  );
}

export function CondicionesReserva() {
  const { settings } = useData();
  return (
    <Shell
      title="Condiciones de reserva"
      eyebrow="Abono referencial · $200.000"
      description="Condiciones de la solicitud de prioridad sobre unidades del catálogo."
    >
      <section className="space-y-2">
        <H>1. Qué es</H>
        <p>
          Pedir reserva es solicitar que te contactemos para confirmar disponibilidad y
          coordinar un abono. <strong className="text-white">No es un contrato de compraventa</strong>{" "}
          ni un pago online.
        </p>
      </section>
      <section className="space-y-2">
        <H>2. Abono</H>
        <p>
          El monto referencial es <strong className="text-white">{clp(200_000)}</strong>. Se
          coordina solo si la unidad sigue disponible. Este sitio no cobra ni procesa pagos.
        </p>
      </section>
      <section className="space-y-2">
        <H>3. Disponibilidad</H>
        <p>El stock puede cambiar. La prioridad se confirma con un asesor.</p>
      </section>
      <section className="space-y-2">
        <H>4. Contacto</H>
        <p>
          {settings.email} ·{" "}
          <Link to="/contacto" className="text-brand hover:underline">
            Contacto
          </Link>
          . Última actualización: septiembre 2026.
        </p>
      </section>
    </Shell>
  );
}
