export const PLACEHOLDER_WHATSAPP = "56987654321";
export const UC_WHATSAPP = "56973236636";

export const SITE = {
  name: "Unidades Chile",
  legal: "Unidades Chile Automotriz",
  whatsapp: UC_WHATSAPP,
  phoneDisplay: "+56 9 7323 6636",
  email: "hola@unidadeschile.cl",
  city: "Puerto Montt, Chile",
  address: "Regimiento #1207, Puerto Montt",
  hours: "Lun a Sáb · 10:00 a 19:00",
  mapQuery: "Regimiento 1207, Puerto Montt, Los Lagos, Chile",
};

export function waDigits(phone = SITE.whatsapp) {
  const digits = phone.replace(/\D/g, "");
  return digits || UC_WHATSAPP;
}

export function waLink(text?: string, phone = SITE.whatsapp) {
  const url = `https://wa.me/${waDigits(phone)}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}
