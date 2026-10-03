import { AdminHub } from "./AdminHub";
import { CRM_VIEWS } from "./crmViews";
import { useData } from "../store/DataProvider";

export function CrmHub() {
  const { leads } = useData();
  const pipeline = [
    { label: "Nuevos", n: leads.filter((l) => l.estado === "nuevo").length },
    { label: "Contactados", n: leads.filter((l) => l.estado === "contactado").length },
    { label: "Ganados", n: leads.filter((l) => l.estado === "ganado").length },
    { label: "Perdidos", n: leads.filter((l) => l.estado === "perdido").length },
  ];

  return (
    <AdminHub
      title="CRM Comercial & Leads"
      subtitle="Gestión unificada de prospectos, pruebas de manejo, reservas y créditos."
      tabs={CRM_VIEWS.map((v) => ({
        to: v.path ? `/admin/crm/${v.path}` : "/admin/crm",
        label: v.label,
        end: !v.path,
      }))}
      extra={
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {pipeline.map((p) => (
            <div key={p.label} className="rounded-xl border border-white/10 bg-[#121212] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/40">{p.label}</p>
              <p className="text-lg font-bold">{p.n}</p>
            </div>
          ))}
        </div>
      }
    />
  );
}
