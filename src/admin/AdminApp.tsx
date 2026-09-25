import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { officialAdmin } from "../lib/adminCredentials";
import { setMeta } from "../lib/documentMeta";
import { getAdminRecord } from "../store/repo";
import { hydrateAdminSession, isAdminSession } from "../store/adminAuth";
import { AdminLayout } from "./AdminLayout";
import { AdminLogin } from "./Login";
import { AdminDashboard } from "./Dashboard";
import { CatalogList } from "./CatalogList";
import { CatalogEditor } from "./CatalogEditor";
import { PublicationsPage } from "./Publications";
import { MediaPage } from "./MediaPage";
import { LeadsPage } from "./Leads";
import { ContentPage } from "./Content";
import { ReportsPage } from "./Reports";
import { SettingsPage } from "./Settings";
import { TelemetryPage } from "./Telemetry";
import { InventoryHub } from "./InventoryHub";
import { CrmHub } from "./CrmHub";
import { ConfigHub } from "./ConfigHub";
import { SoldList } from "./SoldList";
import { CRM_VIEWS } from "./crmViews";

function RequireAuth() {
  if (!isAdminSession()) return <Navigate to="/admin/login" replace />;
  return <AdminLayout />;
}

function CatalogRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/admin/inventario/${id}` : "/admin/inventario"} replace />;
}

export function AdminApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMeta("robots", "noindex, nofollow");
    document.title = "Admin | Unidades Chile";
    void (async () => {
      const official = officialAdmin();
      const rec = await getAdminRecord();
      const hash =
        official?.passwordHash ?? (rec && "passwordHash" in rec ? rec.passwordHash : null);
      await hydrateAdminSession(hash);
      setReady(true);
    })();
    return () => setMeta("robots", "index, follow");
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-black text-sm text-white/40">
        Cargando panel…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireAuth />}>
        <Route index element={<AdminDashboard />} />
        <Route path="telemetria" element={<TelemetryPage />} />

        <Route path="inventario">
          <Route element={<InventoryHub />}>
            <Route index element={<CatalogList />} />
            <Route path="medios" element={<MediaPage />} />
            <Route path="vendidos" element={<SoldList />} />
          </Route>
          <Route path=":id" element={<CatalogEditor />} />
        </Route>

        <Route path="crm" element={<CrmHub />}>
          {CRM_VIEWS.map((view) =>
            view.path ? (
              <Route key={view.path} path={view.path} element={<LeadsPage origins={[...view.origins]} />} />
            ) : (
              <Route key="index" index element={<LeadsPage origins={[]} />} />
            ),
          )}
          <Route path="consignas" element={<Navigate to="/admin/crm/tasaciones" replace />} />
        </Route>

        <Route path="analitica" element={<ReportsPage />} />

        <Route path="config" element={<ConfigHub />}>
          <Route index element={<ContentPage />} />
          <Route path="novedades" element={<PublicationsPage />} />
          <Route path="acceso" element={<SettingsPage />} />
        </Route>

        <Route path="catalogo" element={<Navigate to="/admin/inventario" replace />} />
        <Route path="catalogo/:id" element={<CatalogRedirect />} />
        <Route path="publicaciones" element={<Navigate to="/admin/config/novedades" replace />} />
        <Route path="inventario/novedades" element={<Navigate to="/admin/config/novedades" replace />} />
        <Route path="medios" element={<Navigate to="/admin/inventario/medios" replace />} />
        <Route path="leads" element={<Navigate to="/admin/crm" replace />} />
        <Route path="contenido" element={<Navigate to="/admin/config" replace />} />
        <Route path="reportes" element={<Navigate to="/admin/analitica" replace />} />
        <Route path="ajustes" element={<Navigate to="/admin/config/acceso" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
