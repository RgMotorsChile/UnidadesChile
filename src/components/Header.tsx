import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { waLink } from "../lib/config";
import { useData } from "../store/DataProvider";

const links = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/consigna-tu-vehiculo", label: "Consigna tu vehículo" },
  { to: "/financia", label: "Financia" },
  { to: "/nosotros", label: "Nosotros" },
];

const extraLinks = [
  { to: "/comparador", label: "Comparador" },
  { to: "/contacto", label: "Contacto" },
  { to: "/novedades", label: "Novedades" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { settings } = useData();
  const overHero = pathname === "/";
  const wa = waLink("Hola, quiero consultar por un auto en Unidades Chile.", settings.whatsapp);

  return (
    <header
      className={
        overHero
          ? "absolute inset-x-0 top-0 z-50 bg-transparent pt-[env(safe-area-inset-top)]"
          : "sticky top-0 z-50 border-b border-white/5 bg-black/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl"
      }
    >
      <div className="mx-auto grid h-[68px] max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-[76px] sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Logo />

        <nav className="hidden items-center justify-center lg:flex">
          {links.map((l, i) => (
            <span key={l.to} className="flex items-center">
              {i > 0 && (
                <span className="mx-4 h-[3px] w-[3px] shrink-0 rounded-full bg-white/30" />
              )}
              <NavLink
                to={l.to}
                className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/70 transition hover:text-white"
              >
                {({ isActive }) => (
                  <span className="relative pb-1">
                    {l.label}
                    {isActive && <span className="absolute inset-x-0 -bottom-1 h-px bg-brand" />}
                  </span>
                )}
              </NavLink>
            </span>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-2.5 lg:flex">
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-[12px] font-medium tracking-[0.02em] text-white hover:bg-brand-dark"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Hablar por WhatsApp
          </a>
          <Link
            to="/catalogo"
            className="inline-flex items-center rounded-full border border-white/35 px-4 py-2 text-[12px] font-medium tracking-[0.02em] text-white hover:border-white hover:bg-white/5"
          >
            Ver autos
          </Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 shrink-0 place-items-center justify-self-end rounded-full border border-white/15 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-white/10 bg-black px-4 py-5 sm:px-6 lg:hidden">
          <nav className="flex flex-col gap-4">
            {[...links, ...extraLinks].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-base font-semibold uppercase tracking-[0.12em] sm:text-lg"
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 font-semibold"
            >
              <WhatsAppIcon />
              Hablar por WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.6-1.5-1.87-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.65 1.12 2.83c.14.18 1.93 2.95 4.67 4.14.65.28 1.16.45 1.56.57.65.21 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32ZM12.04 21.5h-.01a9.46 9.46 0 0 1-4.82-1.32l-.35-.2-3.59.94.96-3.5-.23-.36a9.45 9.45 0 0 1-1.45-5.05 9.5 9.5 0 0 1 9.5-9.49c2.53 0 4.91.99 6.7 2.78a9.42 9.42 0 0 1 2.78 6.7 9.5 9.5 0 0 1-9.49 9.5Zm8.18-17.67A11.07 11.07 0 0 0 12.03.02C5.47.02.15 5.33.15 11.88c0 2.09.55 4.13 1.59 5.93L.02 24l6.34-1.66a11.9 11.9 0 0 0 5.67 1.44h.01c6.55 0 11.87-5.32 11.87-11.87 0-3.17-1.23-6.15-3.47-8.39Z" />
    </svg>
  );
}
