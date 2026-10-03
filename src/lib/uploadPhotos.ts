export const VERCEL_SAFE_UPLOAD_BYTES = 3_200_000;

export async function readApiError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const j = JSON.parse(text) as { error?: string; message?: string };
    if (j.error) return j.error;
    if (j.message) return j.message;
  } catch {
    /* texto plano */
  }
  if (res.status === 401) return "Sesión de admin expirada. Vuelve a iniciar sesión.";
  if (res.status === 503) return text || "Falta clave de servidor para guardar fotos.";
  if (text && text.length < 280 && !text.startsWith("<")) return text;
  return `Error al actualizar fotos (HTTP ${res.status}).`;
}

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
      reject(new Error(`No se pudo leer «${file.name}».`));
    };
    img.src = url;
  });
}

export async function convertImageToWebp(file: File): Promise<File> {
  if (!file || file.size < 32) throw new Error(`«${file?.name || "archivo"}» está vacío.`);
  if (/\.(heic|heif)$/i.test(file.name) || /image\/hei/i.test(file.type)) {
    throw new Error(`«${file.name}» es HEIC. Envíala como JPG desde el iPhone o conviértela antes.`);
  }
  if ((file.type === "image/jpeg" || file.type === "image/webp" || /\.(jpe?g|webp)$/i.test(file.name)) && file.size <= VERCEL_SAFE_UPLOAD_BYTES) {
    return file;
  }
  const img = await loadImage(file);
  let width = img.width;
  let height = img.height;
  const maxEdge = Math.max(width, height);
  if (maxEdge > 3200) {
    const scale = 3200 / maxEdge;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no pudo preparar la imagen.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const mime = canvas.toDataURL("image/webp").startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.88));
  if (!blob) throw new Error(`No se pudo convertir «${file.name}».`);
  if (blob.size > VERCEL_SAFE_UPLOAD_BYTES) {
    throw new Error(`«${file.name}» sigue pesando demasiado. Usa una foto más liviana.`);
  }
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.${mime === "image/webp" ? "webp" : "jpg"}`, { type: mime });
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`No se pudo leer «${file.name}».`));
    reader.readAsDataURL(file);
  });
}

export async function uploadPhotosSequentially(opts: {
  slug: string;
  type: "gallery" | "cover";
  files: File[];
  onProgress?: (p: { done: number; total: number; currentName: string }) => void;
}) {
  const { slug, type, files, onProgress } = opts;
  let uploaded = 0;
  const errors: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const original = files[i]!;
    onProgress?.({ done: i, total: files.length, currentName: original.name });
    try {
      const prepared = await convertImageToWebp(original);
      const data = await fileToDataUrl(prepared);
      const uploadType = type === "cover" && i === 0 && uploaded === 0 ? "cover" : "gallery";
      const res = await fetch("/api/admin/photos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          type: uploadType,
          files: [{ name: prepared.name, type: prepared.type, data }],
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      uploaded += 1;
    } catch (err) {
      errors.push(`${original.name}: ${err instanceof Error ? err.message : "falló"}`);
    }
  }
  onProgress?.({ done: files.length, total: files.length, currentName: "" });
  if (!uploaded) throw new Error(errors[0] || "No se pudo subir ninguna foto.");
  return {
    count: uploaded,
    message:
      uploaded === files.length
        ? `Se subieron ${uploaded} foto${uploaded === 1 ? "" : "s"} correctamente.`
        : `Se subieron ${uploaded} de ${files.length}. ${errors.slice(0, 2).join(" · ")}`,
    errors,
  };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
