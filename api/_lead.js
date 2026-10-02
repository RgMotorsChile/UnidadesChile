// Utilidades compartidas para formularios públicos (consigna y contacto).
// Archivo con "_": Vercel no lo publica como ruta.

const WINDOW_MS = 60_000;
const hits = new Map();

/** Rate limit por IP, en memoria de la instancia (best effort, sin dependencias). */
export function rateLimited(req, bucket, limit = 5) {
  const fwd = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = fwd || String(req.headers?.["x-real-ip"] || "anon");
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > limit;
}

/** Solo POST desde el propio sitio (anti-CSRF básico). */
export function untrustedOrigin(req) {
  const host = String(req.headers?.host || "").toLowerCase();
  const raw = req.headers?.origin || req.headers?.referer || "";
  if (!raw) return false;
  try {
    const o = new URL(String(raw)).host.toLowerCase();
    const allowed = new Set([host, "www.unidadeschile.cl", "unidadeschile.cl"]);
    if (process.env.VERCEL_URL) allowed.add(process.env.VERCEL_URL.toLowerCase());
    return !allowed.has(o);
  } catch {
    return true;
  }
}

export function isHoneypot(body) {
  return ["website", "company_url", "hp_field"].some(
    (k) => typeof body?.[k] === "string" && body[k].trim().length > 0,
  );
}

export function clean(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

export function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isEmail(v) {
  return v.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isPhone(v) {
  const d = v.replace(/\D/g, "");
  return d.length >= 8 && d.length <= 12;
}

export function rowsHtml(title, rows) {
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top"><b>${esc(k)}</b></td>` +
        `<td style="padding:6px 0;white-space:pre-wrap">${esc(v === undefined || v === null || v === "" ? "—" : v)}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:600px">
<h2 style="margin:0 0 12px">${esc(title)}</h2>
<table cellpadding="0" style="border-collapse:collapse;font-size:14px">${body}</table>
<p style="margin-top:16px;color:#888;font-size:12px">Enviado desde unidadeschile.cl. Responde este correo para contestarle al cliente.</p>
</div>`;
}

export function mailConfig() {
  return {
    key: process.env.RESEND_API_KEY?.trim() || "",
    to: process.env.CONSIGNA_TO?.trim() || "administracion@rgmotors.cl",
    from: process.env.CONSIGNA_FROM?.trim() || "Unidades Chile <noreply@rgmotorschile.cl>",
  };
}

/** Envía por Resend. Devuelve { ok, status }. Nunca lanza. */
export async function sendResend(payload) {
  const { key } = mailConfig();
  if (!key) return { ok: false, status: 0, reason: "missing_key" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[lead] Resend:", res.status, detail.slice(0, 300));
      return { ok: false, status: res.status, reason: "resend_error" };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    console.error("[lead] Resend falló:", err instanceof Error ? err.message : err);
    return { ok: false, status: 0, reason: "network" };
  }
}

export const FALLBACK_ERROR =
  "No pudimos enviar tu mensaje por correo en este momento. Escríbenos por WhatsApp y te respondemos de inmediato.";
