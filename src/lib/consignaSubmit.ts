export const MAX_FOTOS = 8;

export type FotoPayload = { name: string; type: string; data: string };

export type ConsignaPayload = {
  nombre: string;
  telefono: string;
  email: string;
  patente: string;
  marca: string;
  modelo: string;
  year: string;
  kms: string;
  notas: string;
  fotos: FotoPayload[];
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la foto."));
    };
    img.src = url;
  });
}

/** JPEG ~1280 px para caber en el límite de 4 MB del API. */
export async function compressFoto(file: File): Promise<FotoPayload> {
  const img = await loadImage(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible.");
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
  return {
    name: file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg",
    type: "image/jpeg",
    data: base64,
  };
}

export async function enviarConsigna(payload: ConsignaPayload): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/consigna", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data: { ok?: boolean; error?: string } = {};
  try {
    data = (await res.json()) as { ok?: boolean; error?: string };
  } catch {
    data = {};
  }
  if (!res.ok || !data.ok) {
    return { ok: false, error: data.error || "No se pudo enviar. Intenta de nuevo." };
  }
  return { ok: true };
}
