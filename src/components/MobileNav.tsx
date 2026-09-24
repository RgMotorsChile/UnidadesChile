import { NavLink } from "react-router-dom";
import { Car, Home, Tag } from "lucide-react";
import { WhatsAppIcon } from "./Header";
import { waLink } from "../lib/config";
import { useData } from "../store/DataProvider";

const items = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/catalogo", label: "Catálogo", icon: Car, end: false },
  { to: "/vende-tu-auto", label: "Vender", icon: Tag, end: false },
];

export function MobileNav() {
  const { settings } = useData();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-4 px-2 py-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 text-[11px] ${isActive ? "text-brand" : "text-white/55"}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <a
          href={waLink("Hola, quiero consultar por un auto en Unidades Chile.", settings.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 py-1 text-[11px] text-brand"
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          WhatsApp
        </a>
      </div>
    </nav>
  );
}
