import { put, del } from "@vercel/blob";

export function isBlobReady() {
  return Boolean((process.env.BLOB_READ_WRITE_TOKEN || "").trim());
}

export async function storeMediaFile({ bytes, relativePath, contentType }) {
  const path = String(relativePath || "").replace(/^\/+/, "");
  if (!isBlobReady()) {
    throw new Error("Falta BLOB_READ_WRITE_TOKEN para subir fotos en producción.");
  }
  const blob = await put(path, bytes, {
    access: "public",
    contentType: contentType || "image/jpeg",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return { url: blob.url, relativePath: `/${path}`, storage: "blob" };
}

export async function deleteBlobUrls(urls) {
  const blobUrls = (urls || []).filter((u) => /blob\.vercel-storage\.com/i.test(String(u || "")));
  if (!blobUrls.length || !isBlobReady()) return 0;
  try {
    await del(blobUrls);
    return blobUrls.length;
  } catch {
    let n = 0;
    for (const url of blobUrls) {
      try {
        await del(url);
        n += 1;
      } catch {
        /* ignore */
      }
    }
    return n;
  }
}
