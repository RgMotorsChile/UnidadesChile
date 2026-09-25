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
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

export const config = {
  api: { bodyParser: { sizeLimit: "4mb" } },
};

export default async function handler(
  req: { method?: string; body?: Body },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  }

  const b = req.body || {};
  const nombre = text(b.nombre);
  const telefono = text(b.telefono);
  const email = text(b.email);
  const patente = text(b.patente).toUpperCase();
  const marca = text(b.marca);
  const modelo = text(b.modelo);
  const year = text(b.year);
  const kms = text(b.kms);
  const notas = text(b.notas);

  if (!nombre || !telefono) {
    return res.status(400).json({ ok: false, error: "Faltan nombre o WhatsApp." });
  }
  if (!marca && !modelo && !patente) {
    return res.status(400).json({ ok: false, error: "Indica al menos marca, modelo o patente." });
  }

  const rawFotos = Array.isArray(b.fotos) ? b.fotos.slice(0, 8) : [];
  const attachments = rawFotos
    .map((f, i) => {
      const data = text(f.data).replace(/^data:[^;]+;base64,/, "");
      if (!data || data.length > 900_000) return null;
      const filename = text(f.name) || `foto-${i + 1}.jpg`;
      return { filename, content: data };
    })
    .filter((x): x is { filename: string; content: string } => Boolean(x));

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return res.status(500).json({ ok: false, error: "Correo no configurado." });
  }

  const to = process.env.CONSIGNA_TO?.trim() || "administracion@rgmotors.cl";
  const from =
    process.env.CONSIGNA_FROM?.trim() || "Unidades Chile <noreply@rgmotorschile.cl>";
  const titulo = [marca, modelo, year, patente].filter(Boolean).join(" ") || "sin ficha";

  const html = `
    <h2>Nueva consignación — Unidades Chile</h2>
    <p>Un cliente dejó su vehículo para que lo contacten.</p>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td><b>Nombre</b></td><td>${esc(nombre)}</td></tr>
      <tr><td><b>WhatsApp</b></td><td>${esc(telefono)}</td></tr>
      <tr><td><b>Correo</b></td><td>${esc(email || "—")}</td></tr>
      <tr><td><b>Patente</b></td><td>${esc(patente || "—")}</td></tr>
      <tr><td><b>Marca</b></td><td>${esc(marca || "—")}</td></tr>
      <tr><td><b>Modelo</b></td><td>${esc(modelo || "—")}</td></tr>
      <tr><td><b>Año</b></td><td>${esc(year || "—")}</td></tr>
      <tr><td><b>Kilometraje</b></td><td>${esc(kms || "—")}</td></tr>
      <tr><td><b>Notas</b></td><td>${esc(notas || "—")}</td></tr>
      <tr><td><b>Fotos adjuntas</b></td><td>${attachments.length}</td></tr>
    </table>
    <p style="margin-top:16px">Responder a este correo o escribir al WhatsApp del cliente.</p>
  `;

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject: `Consigna: ${titulo} · ${nombre}`,
    html,
    text: [
      `Consigna Unidades Chile`,
      `Nombre: ${nombre}`,
      `WhatsApp: ${telefono}`,
      `Correo: ${email || "—"}`,
      `Patente: ${patente || "—"}`,
      `Marca: ${marca || "—"}`,
      `Modelo: ${modelo || "—"}`,
      `Año: ${year || "—"}`,
      `Km: ${kms || "—"}`,
      `Notas: ${notas || "—"}`,
    ].join("\n"),
  };
  if (email) payload.reply_to = email;
  if (attachments.length) payload.attachments = attachments;

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!sent.ok) {
    const detail = await sent.text();
    console.error("[consigna] Resend:", sent.status, detail.slice(0, 400));
    return res.status(502).json({ ok: false, error: "No se pudo enviar el correo." });
  }

  return res.status(200).json({ ok: true });
}
