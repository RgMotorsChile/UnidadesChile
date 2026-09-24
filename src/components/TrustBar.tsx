import { BadgeCheck, ClipboardCheck, Clock3, Shield } from "lucide-react";
import { Emblem } from "./Logo";

const items = [
  { icon: BadgeCheck, label: "+1.200 autos entregados" },
  { icon: Shield, label: "Garantía 90 días" },
  { icon: Clock3, label: "Financiamiento 24h" },
  { icon: ClipboardCheck, label: "Inspección 180 puntos" },
];

type Props = {
  compact?: boolean;
};

export function TrustBar({ compact = false }: Props) {
  return (
    <section className="shrink-0 border-y border-white/10 bg-black">
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-center px-4 sm:px-6 lg:px-10 ${compact ? "py-4" : "py-5"}`}
      >
        <ul className="grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-3 lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:justify-center lg:gap-0">
          {items.map(({ icon: Icon, label }, i) => (
            <li key={label} className="flex min-w-0 items-center">
              {i > 0 && <span className="mx-6 hidden h-6 w-px bg-white/15 lg:block" />}
              <span className="flex min-w-0 items-center gap-2 text-[11px] leading-tight tracking-[0.02em] text-white/70 sm:gap-2.5 sm:text-[13px]">
                <Icon size={15} strokeWidth={1.4} className="shrink-0 text-white/55 sm:h-4 sm:w-4" />
                <span className="min-w-0 break-words">{label}</span>
              </span>
            </li>
          ))}
        </ul>
        <span className="mx-8 hidden h-6 w-px bg-white/15 lg:block" />
        <Emblem className="hidden h-12 w-12 lg:block" />
      </div>
    </section>
  );
}
