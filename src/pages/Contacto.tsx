import { useState } from "react";
import { Clock3, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { PageTitle } from "../components/PageTitle";
import { WhatsAppIcon } from "../components/Header";
import { waLink } from "../lib/config";
import { newLead } from "../lib/leads";
import { useData } from "../store/DataProvider";

export function Contacto() {
  const { settings, saveLead } = useData();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sent, setSent] = useState(false);
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(settings.mapQuery)}&z=14&output=embed`;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-28 pt-8 sm:px-6 md:px-8">
      <PageTitle
        title="Contacto | Unidades Chile"
        description="Visítanos en Regimiento 1207, Puerto Montt, o escríbenos por WhatsApp."
      />
      <p className="eyebrow">Sucursal</p>
      <h1 className="mt-3 text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[48px]">
        Contacto y ubicación
      </h1>
      <p className="mt-4 max-w-xl text-white/60">
        Te asesoramos en la compra o venta. Respuesta el mismo día hábil.
      </p>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <form
          className="rounded-2xl border border-white/[0.08] bg-[#141414] p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            void saveLead(
              newLead({
                origen: "contacto",
                nombre,
                telefono,
                email,
                mensaje: mensaje || "Consulta desde contacto",
              }),
            );
            setSent(true);
          }}
        >
          {sent ? (
            <div>
              <p className="text-xl font-semibold">Listo. Te contactamos.</p>
              <p className="mt-2 text-sm text-white/55">
                También puedes escribirnos ahora por WhatsApp.
              </p>
              <a
                href={waLink(
                  `Hola, soy ${nombre}. ${mensaje || "Quiero información."}`,
                  settings.whatsapp,
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Continuar por WhatsApp
              </a>
            </div>
          ) : (
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Escríbenos</h2>
              <label className="text-xs text-muted">
                Nombre
                <input className="field mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs text-muted">
                  WhatsApp
                  <input className="field mt-1" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
                </label>
                <label className="text-xs text-muted">
                  Correo
                  <input
                    type="email"
                    className="field mt-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              </div>
              <label className="text-xs text-muted">
                Mensaje
                <textarea
                  className="field mt-1 min-h-28"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntanos qué buscas"
                />
              </label>
              <button type="submit" className="rounded-xl bg-brand py-3 font-semibold hover:bg-brand-dark">
                Enviar consulta
              </button>
            </div>
          )}
        </form>

        <div className="space-y-3">
          <Info icon={MapPin} title="Showroom" text={settings.address} />
          <Info icon={Phone} title="Teléfono" text={settings.phoneDisplay} />
          <Info icon={Mail} title="Correo" text={settings.email} />
          <Info icon={Clock3} title="Horario" text={settings.hours} />
          <a
            href={waLink("Hola, quiero información de Unidades Chile.", settings.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4 hover:border-white/25"
          >
            <WhatsAppIcon className="h-5 w-5 text-brand" />
            <div>
              <p className="text-sm font-semibold">WhatsApp</p>
              <p className="text-xs text-white/50">{settings.phoneDisplay}</p>
            </div>
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapQuery)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Navigation size={14} />
            Cómo llegar
          </a>
        </div>
      </div>

      <div className="relative mt-10 min-h-[280px] overflow-hidden rounded-[16px] border border-white/10 sm:min-h-[380px]">
        <iframe
          title="Mapa de Unidades Chile"
          src={mapSrc}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPin;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4">
      <Icon size={16} className="mt-0.5 shrink-0 text-brand" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-white/55">{text}</p>
      </div>
    </div>
  );
}
