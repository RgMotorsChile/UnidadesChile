import { useState } from "react";
import { IMAGE_SIZES, imageUrl, isPendingSrc, srcSet } from "@shared/images.mjs";

export function BrandPlaceholder({
  className = "",
  label = "Unidades Chile",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`grid place-items-center bg-[#111] ${className}`}
      role="img"
      aria-label={label}
    >
      <p className="px-3 text-center text-[11px] font-semibold tracking-[0.18em] text-white/55">
        UNIDADES CHILE
      </p>
    </div>
  );
}

export function CarImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes = IMAGE_SIZES,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || isPendingSrc(src) || !imageUrl(src, 768, "webp")) {
    return <BrandPlaceholder className={className} label={alt || "Unidades Chile"} />;
  }
  const fallback = imageUrl(src, 768, "webp");
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(src, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(src, "webp")} sizes={sizes} />
      <img
        src={fallback}
        alt={alt}
        width={800}
        height={600}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={className}
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
