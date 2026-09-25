import { useEffect, useState, type ReactNode } from "react";
import { isPendingPhoto } from "../lib/photos";
import { useMediaSrc } from "../store/useMediaSrc";

export function PhotosPending({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid place-items-center bg-[#111] px-3 text-center ${className}`}
      role="img"
      aria-label="Estamos trabajando en las fotos"
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
          Unidades Chile
        </p>
        <p className="mt-1.5 text-[13px] font-semibold leading-snug text-white">
          Estamos trabajando
          <br />
          en las fotos
        </p>
      </div>
    </div>
  );
}

export function SafeImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const resolved = useMediaSrc(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src, resolved]);

  if (!resolved || failed || isPendingPhoto(src) || isPendingPhoto(resolved)) {
    return <PhotosPending className={className} />;
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-[22px] font-bold tracking-tight text-white sm:text-[28px]">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-white/40">{hint}</p>}
    </div>
  );
}

export function BarList({
  rows,
}: {
  rows: { label: string; n: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-[12px] text-white/70">
            <span>{r.label}</span>
            <span>{r.n}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-[12px] font-medium text-white/55">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function statusTone(status: string) {
  if (status === "publicado") return "bg-emerald-500/15 text-emerald-300";
  if (status === "reservado") return "bg-amber-500/15 text-amber-300";
  if (status === "vendido") return "bg-white/10 text-white/50";
  if (status === "nuevo") return "bg-brand/15 text-brand";
  if (status === "contactado") return "bg-sky-500/15 text-sky-300";
  if (status === "ganado") return "bg-emerald-500/15 text-emerald-300";
  if (status === "perdido") return "bg-white/10 text-white/45";
  return "bg-white/10 text-white/60";
}
