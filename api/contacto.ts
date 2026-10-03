import {
  FALLBACK_ERROR,
  clean,
  isEmail,
  isHoneypot,
  isPhone,
  mailConfig,
  rateLimited,
  UC_BRAND,
  sendConfirmation,
  sendResend,
  untrustedOrigin,
} from "./_lead.js";
import { isValidEmail, teamEmail, visitorEmail } from "./_email.js";

export const config = { runtime: "nodejs" };

type Res = { status: (code: number) => { json: (body: unknown) => void } };
type Req = { method?: string; body?: Record<string, unknown>; headers?: Record<string, string | undefined> };

/** Contacto general → mismo buzón y remitente que Consigna (Resend). */
export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  }
  if (untrustedOrigin(req)) {
    return res.status(403).json({ ok: false, error: "Origen no permitido." });
  }
  if (rateLimited(req, "contacto", 5)) {
    return res.status(429).json({ ok: false, error: "Demasiados envíos. Intenta en un minuto." });
  }
  const b = req.body && typeof req.body === "object" ? req.body : {};
  if (isHoneypot(b)) return res.status(200).json({ ok: true });

  const nombre = clean(b.nombre, 80);
  const email = clean(b.email, 120);
  const telefono = clean(b.telefono, 30);
  const mensaje = clean(b.mensaje, 2000);

  if (!nombre || !email || !telefono || !mensaje) {
    return res.status(400).json({ ok: false, error: "Completa nombre, correo, WhatsApp y mensaje." });
  }
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: "Correo inválido." });
  if (!isPhone(telefono)) return res.status(400).json({ ok: false, error: "Teléfono inválido." });

  const { to, from, key } = mailConfig();
  if (!key) {
    console.error("[contacto] RESEND_API_KEY no configurada");
    return res.status(503).json({ ok: false, fallback: "whatsapp", error: FALLBACK_ERROR });
  }

  const lead = { kind: "contact" as const, name: nombre, email, phone: telefono, message: mensaje, receivedAt: new Date() };
  const sent = await sendResend({ from, to: [to], reply_to: email, ...teamEmail(UC_BRAND, lead) });
  if (!sent.ok) {
    return res.status(503).json({ ok: false, fallback: "whatsapp", error: FALLBACK_ERROR });
  }
  if (isValidEmail(email)) await sendConfirmation(email, visitorEmail(UC_BRAND, lead));
  return res.status(200).json({ ok: true });
}
