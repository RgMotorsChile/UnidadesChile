import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";

export type HubTab = { to: string; label: string; end?: boolean };

export function AdminHub({
  title,
  subtitle,
  tabs,
  extra,
}: {
  title: string;
  subtitle: string;
  tabs: HubTab[];
  extra?: ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-white/45">{subtitle}</p>
      {extra}
      <nav className="mt-6 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold sm:py-1.5 ${
                isActive ? "bg-brand" : "bg-white/5 text-white/55"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
