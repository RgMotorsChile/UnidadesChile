import { Link } from "react-router-dom";
import { Emblem, Logo } from "./Logo";
import { waLink } from "../lib/config";
import { WhatsAppIcon } from "./Header";
import { useData } from "../store/DataProvider";

export function Footer() {
  const { settings } = useData();
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8 lg:py-14">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
            Automotora de autos seleccionados. Los mejores precios de mercado,
            inspección de 180 puntos y una experiencia de compra sin vueltas.
          </p>
        </div>
        <div>
          <p className="eyebrow">Sitio</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-white/80">
            <Link to="/catalogo" className="hover:text-white">Catálogo</Link>
            <Link to="/comparador" className="hover:text-white">Comparador</Link>
            <Link to="/consigna-tu-vehiculo" className="hover:text-white">Consigna tu vehículo</Link>
            <Link to="/financia" className="hover:text-white">Financia</Link>
            <Link to="/nosotros" className="hover:text-white">Nosotros</Link>
            <Link to="/contacto" className="hover:text-white">Contacto</Link>
            <Link to="/novedades" className="hover:text-white">Novedades</Link>
          </div>
        </div>
        <div>
          <p className="eyebrow">Contacto</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-white/80">
            <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a>
            <p>{settings.address}</p>
            <p>{settings.city}</p>
            <p>{settings.hours}</p>
            <a
              href={waLink(undefined, settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-white hover:text-brand"
            >
              <WhatsAppIcon />
              {settings.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="min-w-0 leading-relaxed">
            © {new Date().getFullYear()} {settings.legal}. Todos los derechos reservados.
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link to="/terminos" className="hover:text-white">Términos</Link>
            <Link to="/cookies" className="hover:text-white">Cookies</Link>
            <Link to="/aviso-credito" className="hover:text-white">Aviso de crédito</Link>
            <Link to="/condiciones-reserva" className="hover:text-white">Reserva</Link>
            <Emblem className="h-8 w-8 shrink-0 opacity-80" />
          </div>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-1.5 px-4 py-4 text-center text-[11px] text-muted sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-2 sm:px-6 lg:px-8">
          <span>
            Desarrollado por <span className="font-medium text-white/80">Mathias Jara</span> &middot; Desarrollador Full Stack
          </span>
          <span className="hidden text-white/20 sm:inline">&middot;</span>
          <span className="flex flex-wrap items-center justify-center gap-x-2">
            <a href="https://wa.me/56964710361" target="_blank" rel="noreferrer" className="hover:text-white">
              +56 9 6471 0361
            </a>
            <span className="text-white/20">&middot;</span>
            <a href="mailto:mathias.jara@hotmail.com" className="hover:text-white">
              mathias.jara@hotmail.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
