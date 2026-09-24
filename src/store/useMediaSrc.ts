import { useEffect, useState } from "react";
import { mediaRepo } from "./repo";

const cache = new Map<string, string>();

export function useMediaSrc(src: string | undefined) {
  const [url, setUrl] = useState(src && !src.startsWith("idb:") ? src : "");

  useEffect(() => {
    if (!src) {
      setUrl("");
      return;
    }
    if (!src.startsWith("idb:")) {
      setUrl(src);
      return;
    }
    const id = src.slice(4);
    const hit = cache.get(id);
    if (hit) {
      setUrl(hit);
      return;
    }
    let alive = true;
    mediaRepo.blob(id).then((blob) => {
      if (!alive || !blob) return;
      const objectUrl = URL.createObjectURL(blob);
      cache.set(id, objectUrl);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  return url;
}
