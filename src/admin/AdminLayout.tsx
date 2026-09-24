import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Car,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { closeAdminSession } from "../store/adminAuth";

const nav = [
  { to: "/admin", label: "Dashboard Ejecutivo", short: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/telemetria", label: "Telemetría & Salud", short: "Salud", icon: Activity },
  { to: "/admin/inventario", label: "Inventario & Multimedia", short: "Stock", icon: Car },
  { to: "/admin/crm", label: "CRM Comercial & Leads", short: "CRM", icon: MessageSquare },
  { to: "/admin/analitica", label: "Analítica & Reportes", short: "Reportes", icon: BarChart3 },
  { to: "/admin/config", label: "Configuración", short: "Ajustes", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const current =
    [...nav].reverse().find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to))) ?? nav[0];

  const logout = () => {
    closeAdminSession();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-dvh bg-[#070707] text-white">
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#0c0c0c] lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Logo />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
            Portal administrador UC
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium ${
                  isActive ? "bg-brand text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 space-y-1 border-t border-white/10 pt-3">
          <a
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-white/45 hover:bg-white/5 hover:text-white"
          >
            ← Volver al sitio público
          </a>
          <a
            href="https://rg-motors-chile-web.vercel.app/admin"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/60 hover:bg-white/5 hover:text-white"
          >
            Panel RG Motors
          </a>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] text-red-400/80 hover:bg-white/5 hover:text-red-300"
            onClick={logout}
          >
            <LogOut size={16} />
            Cerrar sesión admin
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070707]/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-[13px] text-white/50">Unidades Chile · {current.short}</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" className="hidden text-[12px] font-semibold text-white/70 hover:text-white sm:inline">
                Ver sitio →
              </a>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 lg:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </header>

        {open && (
          <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setOpen(false)}>
            <div
              className="absolute inset-x-0 top-0 max-h-[90dvh] overflow-y-auto rounded-b-3xl border-b border-white/10 bg-[#0c0c0c] px-4 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">Menú admin</p>
              <nav className="mt-4 grid gap-1.5">
                {nav.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium ${
                        isActive ? "bg-brand" : "bg-white/5 text-white/70"
                      }`
                    }
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-4 grid gap-2">
                <a href="/" className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/60">
                  Sitio público
                </a>
                <button type="button" className="rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-red-300" onClick={logout}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
