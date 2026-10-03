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

export function mailConfig() {
  return {
    key: process.env.RESEND_API_KEY?.trim() || "",
    to: process.env.CONSIGNA_TO?.trim() || "administracion@rgmotors.cl",
    from: process.env.CONSIGNA_FROM?.trim() || "Unidades Chile <noreply@rgmotorschile.cl>",
  };
}

/** Marca para las plantillas (logo PNG absoluto: Gmail/Outlook no muestran SVG). */
export const UC_BRAND = {
  name: "Unidades Chile",
  site: "https://www.unidadeschile.cl",
  siteLabel: "unidadeschile.cl",
  logoUrl: "https://www.unidadeschile.cl/email/uc-logo.png",
  logoWidth: 240,
  logoHeight: 45,
  headerBg: "#0a0a0a",
  accent: "#ff0c40",
  accentText: "#ffffff",
  ink: "#111827",
  whatsapp: "56973236636",
  phoneDisplay: "+56 9 7323 6636",
  email: "administracion@rgmotors.cl",
  address: "Regimiento #1207, Puerto Montt",
  hours: "Lun a Sáb · 10:00 a 19:00",
};

/**
 * Confirmación al visitante. Nunca lanza ni cambia la respuesta del formulario:
 * se llama solo después de que el aviso al equipo salió bien.
 */
export async function sendConfirmation(toEmail, mail) {
  try {
    const { from, to } = mailConfig();
    const r = await sendResend({ from, to: [toEmail], reply_to: to, ...mail });
    if (!r.ok) console.warn("[lead] Confirmación al visitante no enviada:", r.reason);
    return r.ok;
  } catch (err) {
    console.warn("[lead] Confirmación falló:", err instanceof Error ? err.message : err);
    return false;
  }
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
    // Solo el id de Resend (sin destinatario) para rastrear la entrega.
    const sent = await res.json().catch(() => null);
    console.info("[lead] Resend id:", sent?.id ?? "?", "·", String(payload?.subject ?? "").slice(0, 60));
    return { ok: true, status: res.status, id: sent?.id };
  } catch (err) {
    console.error("[lead] Resend falló:", err instanceof Error ? err.message : err);
    return { ok: false, status: 0, reason: "network" };
  }
}

export const FALLBACK_ERROR =
  "No pudimos enviar tu mensaje por correo en este momento. Escríbenos por WhatsApp y te respondemos de inmediato.";
