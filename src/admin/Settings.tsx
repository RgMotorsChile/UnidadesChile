import { useEffect, useState } from "react";
import { officialAdmin } from "../lib/adminCredentials";
import { exportBackup, getAdminRecord, importBackup, reseedCatalog, saveAdminUser } from "../store/repo";
import { hashPassword, openAdminSession } from "../store/adminAuth";
import { useData } from "../store/DataProvider";
import { downloadText } from "../lib/stats";
import { STOCK_SOURCES } from "../lib/sources";
import { AdminField } from "./ui";

export function SettingsPage() {
  const { refresh } = useData();
  const official = officialAdmin();
  const [user, setUser] = useState(official?.user ?? "admin");

  useEffect(() => {
    void getAdminRecord().then((u) => {
      if (u?.user) setUser(u.user);
    });
  }, []);

  return (
    <div className="max-w-xl">
      <p className="text-sm text-white/45">
        Acceso, respaldo y stock. Los datos de este panel viven en este navegador.
      </p>

      {official ? (
        <p className="mt-8 rounded-2xl border border-white/10 p-5 text-sm text-white/55">
          El acceso de producción es <strong className="text-white">{official.user}</strong>.
          Para cambiar la clave hay que actualizar las variables en Vercel y volver a desplegar.
        </p>
      ) : (
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const current = await getAdminRecord();
          const nextPass = String(data.get("password") ?? "");
          const nextUser = String(data.get("user") ?? current?.user ?? "admin");
          const passwordHash =
            nextPass
              ? await hashPassword(nextPass)
              : current && "passwordHash" in current
                ? current.passwordHash
                : "";
          if (!passwordHash) {
            alert("Define una contraseña nueva.");
            return;
          }
          await saveAdminUser({ user: nextUser, passwordHash });
          await openAdminSession(passwordHash);
          alert("Acceso actualizado.");
        }}
      >
        <AdminField label="Usuario">
          <input name="user" className="field" defaultValue={user} key={user} />
        </AdminField>
        <AdminField label="Nueva contraseña (vacío = no cambiar)">
          <input name="password" type="password" className="field" />
        </AdminField>
        <button type="submit" className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold">
          Guardar acceso
        </button>
      </form>
      )}

      <div className="mt-12 rounded-2xl border border-white/10 p-5">
        <h2 className="font-semibold">Respaldo</h2>
        <p className="mt-2 text-sm text-white/45">
          Exporta el catálogo, leads y textos. Guarda el archivo en el PC de la sucursal.
          Las fotos del stock en /cars/stock no van en el JSON.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold"
            onClick={async () => {
              const dump = await exportBackup();
              downloadText(
                `backup-unidadeschile-${new Date().toISOString().slice(0, 10)}.json`,
                JSON.stringify(dump, null, 2),
                "application/json",
              );
            }}
          >
            Descargar backup
          </button>
          <label className="rounded-full border border-white/15 px-5 py-2 text-sm">
            Restaurar backup
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  const dump = JSON.parse(await file.text());
                  await importBackup(dump);
                  await refresh();
                  alert("Backup restaurado.");
                } catch {
                  alert("El archivo no es un backup válido.");
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 p-5">
        <h2 className="font-semibold">Stock</h2>
        <p className="mt-2 text-sm text-white/45">
          Vuelve a cargar las 18 unidades de Unidades Chile desde el archivo del sitio.
          No borra leads ni textos.
        </p>
        <button
          type="button"
          className="mt-4 rounded-full border border-white/15 px-5 py-2 text-sm"
          onClick={async () => {
            if (!confirm("¿Recargar el stock oficial? Se reemplazan las unidades actuales.")) return;
            await reseedCatalog();
            await refresh();
            alert("Stock recargado.");
          }}
        >
          Recargar stock oficial
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 p-5">
        <h2 className="font-semibold">Origen del stock</h2>
        <p className="mt-2 text-sm text-white/45">
          Este sitio es independiente. El catálogo sale solo de la hoja{" "}
          <strong className="text-white">{STOCK_SOURCES.sheetName}</strong>.
          Las fotos viven en este proyecto. Cuando migres a la cuenta de empresa,
          conecta estos IDs ahí, no en una cuenta personal.
        </p>
        <ul className="mt-4 space-y-2 text-xs text-white/50">
          <li>
            Planilla:{" "}
            <a href={STOCK_SOURCES.sheetUrl} target="_blank" rel="noreferrer" className="text-brand">
              {STOCK_SOURCES.sheetName}
            </a>
          </li>
          <li>
            Fotos:{" "}
            <a href={STOCK_SOURCES.driveFolderUrl} target="_blank" rel="noreferrer" className="text-brand">
              fotos por patente
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
