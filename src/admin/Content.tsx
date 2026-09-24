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
          address: String(data.get("address") ?? settings.address),
          mapQuery: String(data.get("map") ?? settings.mapQuery),
          hours: String(data.get("hours") ?? settings.hours),
          whatsapp: String(data.get("wa") ?? settings.whatsapp),
          phoneDisplay: String(data.get("phone") ?? settings.phoneDisplay),
          email: String(data.get("email") ?? settings.email),
          city: String(data.get("city") ?? settings.city),
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
        <AdminField label="Dirección">
          <input name="address" className="field" defaultValue={settings.address} />
        </AdminField>
        <AdminField label="Consulta del mapa">
          <input name="map" className="field" defaultValue={settings.mapQuery} />
        </AdminField>
        <AdminField label="Horario">
          <input name="hours" className="field" defaultValue={settings.hours} />
        </AdminField>
        <AdminField label="WhatsApp (solo números, ej: 56912345678)">
          <input name="wa" className="field" defaultValue={settings.whatsapp} />
        </AdminField>
        <AdminField label="Teléfono visible">
          <input name="phone" className="field" defaultValue={settings.phoneDisplay} />
        </AdminField>
        <AdminField label="Email">
          <input name="email" className="field" defaultValue={settings.email} />
        </AdminField>
        <AdminField label="Ciudad">
          <input name="city" className="field" defaultValue={settings.city} />
        </AdminField>
      </div>
      <button type="submit" className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold">
        Guardar contenido
      </button>
    </form>
  );
}
