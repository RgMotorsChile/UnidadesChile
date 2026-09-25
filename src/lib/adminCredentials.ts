/** Acceso oficial de producción. El hash llega por env de Vercel; la clave no va en el repo. */

export type OfficialAdmin = {
  user: string;
  passwordHash: string;
};

export function officialAdmin(): OfficialAdmin | null {
  const user = (import.meta.env.VITE_ADMIN_USER ?? "").trim();
  const passwordHash = (import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? "").trim();
  if (!user || !passwordHash) return null;
  return { user, passwordHash };
}
