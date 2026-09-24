export const PLACEHOLDER_WHATSAPP = "56987654321";

export const SITE = {
  name: "Unidades Chile",
  legal: "Unidades Chile Automotriz",
  whatsapp: PLACEHOLDER_WHATSAPP,
  phoneDisplay: "+56 9 8765 4321",
  email: "hola@unidadeschile.cl",
  city: "Puerto Montt, Chile",
  address: "Regimiento #1207, Puerto Montt",
  hours: "Lun a Sáb · 10:00 a 19:00",
  mapQuery: "Regimiento 1207, Puerto Montt, Los Lagos, Chile",
};

export function waLink(text?: string, phone = SITE.whatsapp) {
  const url = `https://wa.me/${phone}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}
