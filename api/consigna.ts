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

type FotoIn = { name?: string; type?: string; data?: string };

type Body = {
  nombre?: string;
  telefono?: string;
  email?: string;
  patente?: string;
  marca?: string;
  modelo?: string;
  year?: string;
  kms?: string;
  notas?: string;
  fotos?: FotoIn[];
  website?: string;
};

export const config = {
  api: { bodyParser: { sizeLimit: "4mb" } },
};

type Req = { method?: string; body?: Body; headers?: Record<string, string | undefined> };
type Res = { status: (code: number) => { json: (body: unknown) => void } };

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  }
  if (untrustedOrigin(req)) {
    return res.status(403).json({ ok: false, error: "Origen no permitido." });
  }
  if (rateLimited(req, "consigna", 5)) {
    return res.status(429).json({ ok: false, error: "Demasiados envíos. Intenta en un minuto." });
  }

  const b = req.body && typeof req.body === "object" ? req.body : {};
  if (isHoneypot(b)) return res.status(200).json({ ok: true });

  const nombre = clean(b.nombre, 80);
  const telefono = clean(b.telefono, 30);
  const email = clean(b.email, 120);
  const patente = clean(b.patente, 10).toUpperCase();
  const marca = clean(b.marca, 40);
  const modelo = clean(b.modelo, 60);
  const year = clean(b.year, 4);
  const kms = clean(b.kms, 12);
  const notas = clean(b.notas, 1500);

  if (!nombre || !telefono) {
    return res.status(400).json({ ok: false, error: "Faltan nombre o WhatsApp." });
  }
  if (!isPhone(telefono)) {
    return res.status(400).json({ ok: false, error: "Teléfono inválido." });
  }
  if (email && !isEmail(email)) {
    return res.status(400).json({ ok: false, error: "Correo inválido." });
  }
  if (!marca && !modelo && !patente) {
    return res.status(400).json({ ok: false, error: "Indica al menos marca, modelo o patente." });
  }
  if (year && !/^\d{4}$/.test(year)) {
    return res.status(400).json({ ok: false, error: "Año inválido." });
  }

  const rawFotos = Array.isArray(b.fotos) ? b.fotos.slice(0, 8) : [];
  const attachments = rawFotos
    .map((f, i) => {
      const data = clean(f?.data, 1_000_000).replace(/^data:[^;]+;base64,/, "");
      if (!data || data.length > 900_000 || !/^[A-Za-z0-9+/=]+$/.test(data)) return null;
      const base = clean(f?.name, 60).replace(/[^\w.-]+/g, "_") || `foto-${i + 1}`;
      const filename = /\.(jpe?g|png|webp)$/i.test(base) ? base : `${base}.jpg`;
      return { filename, content: data };
    })
    .filter((x): x is { filename: string; content: string } => Boolean(x));

  const { key, to, from } = mailConfig();
  if (!key) {
    console.error("[consigna] RESEND_API_KEY no configurada");
    return res.status(503).json({ ok: false, fallback: "whatsapp", error: FALLBACK_ERROR });
  }

  const lead = {
    kind: "consigna" as const,
    name: nombre,
    email,
    phone: telefono,
    message: notas,
    vehicle: { brand: marca, model: modelo, year, km: kms, plate: patente, photos: attachments.length },
    receivedAt: new Date(),
  };
  const payload: Record<string, unknown> = { from, to: [to], ...teamEmail(UC_BRAND, lead) };
  if (email) payload.reply_to = email;
  if (attachments.length) payload.attachments = attachments;

  const sent = await sendResend(payload);
  if (!sent.ok) {
    return res.status(503).json({ ok: false, fallback: "whatsapp", error: FALLBACK_ERROR });
  }
  if (email && isValidEmail(email)) await sendConfirmation(email, visitorEmail(UC_BRAND, lead));
  return res.status(200).json({ ok: true });
}
