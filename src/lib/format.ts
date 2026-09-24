export function clp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function km(value: number) {
  return `${new Intl.NumberFormat("es-CL").format(value)} km`;
}

export function savingsLabel(price: number, market: number) {
  const diff = market - price;
  if (diff <= 0) return null;
  const millions = diff / 1_000_000;
  if (millions >= 1) {
    const n = millions >= 10 ? millions.toFixed(0) : millions.toFixed(1);
    return `−$${n}M vs mercado`;
  }
  return `−${clp(diff)} vs mercado`;
}

export function marketPct(price: number, market: number) {
  if (market <= 0) return 0;
  return Math.round(((market - price) / market) * 100);
}
