import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { officialAdmin } from "../lib/adminCredentials";
import { matchesOfficialAdmin, shouldTryServerLogin } from "../lib/adminLoginFlow";
import { Logo } from "../components/Logo";
import { saveAdminUser } from "../store/repo";
import { adminChangePassword, adminLogin } from "../lib/adminApi";
import {
  hashPassword,
  isAdminSession,
  mustChangePassword,
  openAdminSession,
  openServerSession,
} from "../store/adminAuth";

export function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const official = officialAdmin();
  const [mode, setMode] = useState<"login" | "setup" | "loading" | "change">("login");
  const [user, setUser] = useState(official?.user ?? "admin");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const creds = officialAdmin();
    if (creds) {
      setUser((prev) => prev || creds.user);
    } else {
      setUser((prev) => prev);
    }
    if (searchParams.get("change") === "1" || mustChangePassword()) {
      setMode("change");
      setInfo("Por seguridad debes cambiar la contraseña antes de entrar al panel.");
      const saved = sessionStorage.getItem("uc-admin-user");
      if (saved) setUser(saved);
    }
  }, [searchParams]);

  if (isAdminSession() && !mustChangePassword() && mode !== "change") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-black px-4 py-10">
      <form
        className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#111] p-6 sm:p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (mode === "loading") return;

          if (mode === "setup") {
            if (official) return;
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

          if (mode === "change") {
            if (password !== confirm) {
              setError("Las contraseñas nuevas no coinciden.");
              return;
            }
            if (!currentPassword) {
              setError("Ingresa tu contraseña temporal actual.");
              return;
            }
            try {
              await adminChangePassword(user.trim(), currentPassword, password);
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
              return;
            }
            openServerSession(false);
            navigate("/admin", { replace: true });
            return;
          }

          const passwordHash = await hashPassword(password);
          if (matchesOfficialAdmin(official, user, passwordHash) && official) {
            try {
              await adminLogin(user, password);
            } catch {
              setError("No se pudo iniciar sesión en el servidor. Intenta de nuevo.");
              return;
            }
            await saveAdminUser({ user: official.user, passwordHash: official.passwordHash });
            await openAdminSession(official.passwordHash);
            navigate("/admin", { replace: true });
            return;
          }

          if (!shouldTryServerLogin(official, user, passwordHash)) {
            setError("Usuario o contraseña incorrectos.");
            return;
          }

          try {
            const data = await adminLogin(user.trim(), password);
            sessionStorage.setItem("uc-admin-user", user.trim());
            if (data.mustChange) {
              openServerSession(true);
              setMode("change");
              setCurrentPassword("");
              setPassword("");
              setConfirm("");
              setInfo("Primer acceso: elige una contraseña fuerte. No podrás usar el panel hasta hacerlo.");
              return;
            }
            openServerSession(false);
            navigate("/admin", { replace: true });
          } catch {
            setError("Usuario o contraseña incorrectos.");
          }
        }}
      >
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">
          {mode === "setup" ? "Crear acceso del panel" : mode === "change" ? "Cambiar contraseña" : "Entrar al panel"}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {mode === "setup"
            ? "Primera vez en este navegador. Elige un usuario y una clave. No se guarda en el sitio público."
            : mode === "change"
              ? info || "Elige una contraseña fuerte para continuar."
              : official
                ? "Dashboard, inventario, CRM, analítica y configuración de Unidades Chile."
                : "Ingresa con tu usuario de RG Motors (el mismo de Boletas) y su contraseña."}
        </p>
        <label className="mt-6 block text-xs text-white/45">
          Usuario
          <input
            className="field mt-1.5"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            readOnly={mode === "change"}
          />
        </label>
        {mode === "change" && (
          <label className="mt-4 block text-xs text-white/45">
            Contraseña temporal actual
            <input
              className="field mt-1.5"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        )}
        <label className="mt-4 block text-xs text-white/45">
          {mode === "change" ? "Nueva contraseña" : "Contraseña"}
          <input
            className="field mt-1.5"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "setup" || mode === "change" ? "new-password" : "current-password"}
          />
        </label>
        {(mode === "setup" || mode === "change") && (
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
          {mode === "setup" ? "Crear acceso" : mode === "change" ? "Guardar y entrar" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
