const SESSION = "uc-admin-session";

let hydrated = false;
let sessionValid = false;

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

export async function hydrateAdminSession(passwordHash: string | null) {
  const token = sessionStorage.getItem(SESSION);
  sessionValid = Boolean(token && passwordHash && token === (await sessionToken(passwordHash)));
  hydrated = true;
  return sessionValid;
}

export async function openAdminSession(passwordHash: string) {
  sessionStorage.setItem(SESSION, await sessionToken(passwordHash));
  sessionValid = true;
  hydrated = true;
}

export function closeAdminSession() {
  sessionStorage.removeItem(SESSION);
  sessionValid = false;
}
