export const CRM_VIEWS = [
  { path: "", label: "Leads & Scoring", origins: [] as readonly string[] },
  { path: "visitas", label: "Pruebas de Manejo", origins: ["visita", "prueba-manejo"] },
  { path: "reservas", label: "Reservas Online", origins: ["reserva"] },
  { path: "creditos", label: "Créditos & RUT", origins: ["financia", "credito"] },
  { path: "simulaciones", label: "Simulaciones DS", origins: ["simulacion"] },
  { path: "tasaciones", label: "Tasaciones / Retomas", origins: ["tasacion", "consigna"] },
  { path: "pedidos", label: "Autos a Pedido & Alertas", origins: ["auto-pedido", "alerta-precio"] },
  { path: "clientes", label: "Base de Clientes", origins: [] as readonly string[] },
] as const;

export function matchesOrigin(origen: string, prefixes: readonly string[]) {
  if (!prefixes.length) return true;
  return prefixes.some((p) => origen.startsWith(p));
}

export function countByOrigins(leads: { origen: string }[], prefixes: readonly string[]) {
  return leads.filter((l) => matchesOrigin(l.origen, prefixes)).length;
}
