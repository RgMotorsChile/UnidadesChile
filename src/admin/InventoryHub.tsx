import { AdminHub } from "./AdminHub";

export function InventoryHub() {
  return (
    <AdminHub
      title="Inventario & Multimedia"
      subtitle="Fichas, fotos y notas. Solo stock de la hoja UNIDADES CHILE."
      tabs={[
        { to: "/admin/inventario", label: "Vehículos", end: true },
        { to: "/admin/inventario/medios", label: "Multimedia" },
        { to: "/admin/inventario/novedades", label: "Publicaciones" },
        { to: "/admin/inventario/vendidos", label: "Vendidos" },
      ]}
    />
  );
}
