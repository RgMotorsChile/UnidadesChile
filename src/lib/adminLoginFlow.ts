import type { OfficialAdmin } from "./adminCredentials";

/** La cuenta oficial del entorno se verifica primero y no se modifica. */
export function matchesOfficialAdmin(
  official: OfficialAdmin | null,
  user: string,
  passwordHash: string,
) {
  return Boolean(official && user === official.user && passwordHash === official.passwordHash);
}

/** Si no coincide la cuenta oficial, el servidor puede autenticar a otro admin. */
export function shouldTryServerLogin(
  official: OfficialAdmin | null,
  user: string,
  passwordHash: string,
) {
  if (!user.trim()) return false;
  if (!official) return true;
  return !matchesOfficialAdmin(official, user, passwordHash);
}
