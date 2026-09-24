export const CRM_VIEWS = [
  { path: "", label: "Todos", origins: [] as readonly string[] },
  { path: "reservas", label: "Reservas", origins: ["reserva"] },
  { path: "creditos", label: "Créditos", origins: ["financia", "credito"] },
  { path: "tasaciones", label: "Tasaciones", origins: ["tasacion"] },
  { path: "visitas", label: "Visitas / test drive", origins: ["visita", "prueba-manejo"] },
  { path: "pedidos", label: "Pedidos", origins: ["auto-pedido"] },
  { path: "alertas", label: "Alertas de precio", origins: ["alerta-precio"] },
] as const;

export function matchesOrigin(origen: string, prefixes: readonly string[]) {
  if (!prefixes.length) return true;
  return prefixes.some((p) => origen.startsWith(p));
}

export function countByOrigins(leads: { origen: string }[], prefixes: readonly string[]) {
  return leads.filter((l) => matchesOrigin(l.origen, prefixes)).length;
}
