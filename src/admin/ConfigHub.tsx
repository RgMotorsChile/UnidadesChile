import { AdminHub } from "./AdminHub";

export function ConfigHub() {
  return (
    <AdminHub
      title="Configuración"
      subtitle="Parámetros del negocio, contacto y acceso al panel."
      tabs={[
        { to: "/admin/config", label: "Sitio y sucursal", end: true },
        { to: "/admin/config/novedades", label: "Publicaciones" },
        { to: "/admin/config/acceso", label: "Acceso y respaldo" },
      ]}
    />
  );
}
