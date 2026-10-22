import { useData } from "../store/DataProvider";
import { AdminField } from "./ui";

export function ContentPage() {
  const { settings, updateSettings } = useData();

  return (
    <form
      className="max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        updateSettings({
          ...settings,
          homeHeadline1: String(data.get("h1") ?? settings.homeHeadline1),
          homeHeadline2: String(data.get("h2") ?? settings.homeHeadline2),
          homeSub: String(data.get("sub") ?? settings.homeSub),
        });
        alert("Contenido del sitio guardado.");
      }}
    >
      <p className="text-sm text-white/45">Textos del home, contacto y ubicación.</p>
      <div className="mt-8 grid gap-4">
        <AdminField label="Titular línea 1">
          <input name="h1" className="field" defaultValue={settings.homeHeadline1} />
        </AdminField>
        <AdminField label="Titular línea 2">
          <input name="h2" className="field" defaultValue={settings.homeHeadline2} />
        </AdminField>
        <AdminField label="Bajada">
          <textarea name="sub" className="field min-h-[80px]" defaultValue={settings.homeSub} />
        </AdminField>
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-4 text-sm text-white/70">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Contacto del sitio
          </p>
          <p className="mt-3">{settings.address}</p>
          <p>{settings.city}</p>
          <p>{settings.hours}</p>
          <p>{settings.phoneDisplay}</p>
          <p>{settings.email}</p>
          <p className="mt-3 text-[12px] text-white/40">
            Dirección, teléfono, horario, WhatsApp y correo salen de una sola configuración.
            El correo administracion@rgmotors.cl queda pendiente de confirmación de Mathias.
            El WhatsApp de esta sucursal no se unifica con los otros sitios.
          </p>
        </div>
      </div>
      <button type="submit" className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold">
        Guardar contenido
      </button>
    </form>
  );
}
