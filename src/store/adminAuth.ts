const SESSION = "uc-admin-session";

let hydrated = false;
let sessionValid = false;
let sessionMustChange = false;

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string) {
  return sha256Hex(`uc-pw:${password}`);
}

export async function sessionToken(passwordHash: string) {
  return sha256Hex(`uc-sess:${passwordHash}`);
}

export function isAuthHydrated() {
  return hydrated;
}

export function isAdminSession() {
  return sessionValid;
}

export function mustChangePassword() {
  return sessionMustChange;
}

export async function hydrateAdminSession(passwordHash: string | null) {
  const token = sessionStorage.getItem(SESSION);
  sessionValid = Boolean(token && passwordHash && token === (await sessionToken(passwordHash)));
  sessionMustChange = false;
  hydrated = true;
  return sessionValid;
}

export async function openAdminSession(passwordHash: string) {
  sessionStorage.setItem(SESSION, await sessionToken(passwordHash));
  sessionValid = true;
  sessionMustChange = false;
  hydrated = true;
}

export function closeAdminSession() {
  sessionStorage.removeItem(SESSION);
  sessionValid = false;
  sessionMustChange = false;
}

/** Sesión respaldada por la cookie del servidor (cuenta RG de Supabase). */
export function openServerSession(mustChange = false) {
  sessionValid = true;
  sessionMustChange = mustChange;
  hydrated = true;
}

export async function hydrateServerSession() {
  try {
    const res = await fetch("/api/admin/login", { credentials: "include" });
    const data = res.ok ? ((await res.json().catch(() => ({}))) as { ok?: boolean; mustChange?: boolean }) : {};
    sessionValid = Boolean(res.ok && data.ok !== false);
    sessionMustChange = Boolean(sessionValid && data.mustChange);
  } catch {
    sessionValid = false;
    sessionMustChange = false;
  }
  hydrated = true;
  return { ok: sessionValid, mustChange: sessionMustChange };
}
