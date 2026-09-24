import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { getAdminRecord, saveAdminUser } from "../store/repo";
import { hashPassword, isAdminSession, openAdminSession } from "../store/adminAuth";

export function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "setup" | "loading">("loading");
  const [user, setUser] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void getAdminRecord().then((rec) => {
      setMode(rec ? "login" : "setup");
      if (rec?.user) setUser(rec.user);
    });
  }, []);

  if (isAdminSession()) return <Navigate to="/admin" replace />;

  return (
    <div className="grid min-h-dvh place-items-center bg-black px-4 py-10">
      <form
        className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#111] p-6 sm:p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (mode === "loading") return;

          if (mode === "setup") {
            if (password.length < 8) {
              setError("Usa al menos 8 caracteres.");
              return;
            }
            if (password !== confirm) {
              setError("Las contraseñas no coinciden.");
              return;
            }
            const passwordHash = await hashPassword(password);
            await saveAdminUser({ user: user.trim() || "admin", passwordHash });
            await openAdminSession(passwordHash);
            navigate("/admin", { replace: true });
            return;
          }

          const rec = await getAdminRecord();
          if (!rec) {
            setMode("setup");
            return;
          }
          const passwordHash = await hashPassword(password);
          const ok =
            "passwordHash" in rec
              ? rec.passwordHash === passwordHash
              : rec.legacyPassword === password;
          if (!ok || user !== rec.user) {
            setError("Usuario o contraseña incorrectos.");
            return;
          }
          if ("legacyPassword" in rec) {
            await saveAdminUser({ user: rec.user, passwordHash });
          }
          await openAdminSession(passwordHash);
          navigate("/admin", { replace: true });
        }}
      >
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">
          {mode === "setup" ? "Crear acceso del panel" : "Entrar al panel"}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {mode === "setup"
            ? "Primera vez en este navegador. Elige un usuario y una clave. No se guarda en el sitio público."
            : "Dashboard, inventario, CRM, analítica y configuración de Unidades Chile."}
        </p>
        <label className="mt-6 block text-xs text-white/45">
          Usuario
          <input className="field mt-1.5" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
        </label>
        <label className="mt-4 block text-xs text-white/45">
          Contraseña
          <input
            className="field mt-1.5"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "setup" ? "new-password" : "current-password"}
          />
        </label>
        {mode === "setup" && (
          <label className="mt-4 block text-xs text-white/45">
            Confirmar contraseña
            <input
              className="field mt-1.5"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        )}
        {error && <p className="mt-3 text-sm text-brand">{error}</p>}
        <button type="submit" className="mt-6 w-full rounded-full bg-brand py-3 text-sm font-semibold">
          {mode === "setup" ? "Crear acceso" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
