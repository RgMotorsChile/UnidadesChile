import { AdminHub } from "./AdminHub";

export function InventoryHub() {
  return (
    <AdminHub
      title="Inventario & Multimedia"
      subtitle="Administración integral de vehículos, fichas técnicas y fotos. Solo stock UNIDADES CHILE."
      tabs={[
        { to: "/admin/inventario", label: "Catálogo de Vehículos", end: true },
        { to: "/admin/inventario/medios", label: "Estudio de Fotos" },
        { to: "/admin/inventario/vendidos", label: "Historial de Ventas" },
      ]}
    />
  );
}
