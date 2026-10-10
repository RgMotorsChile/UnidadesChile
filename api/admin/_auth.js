import { supabaseAnon } from "./_db.js";
import { createHash } from "node:crypto";

export function sha256Hex(text) {
  return createHash("sha256").update(text).digest("hex");
}

export function officialPasswordHash() {
  return (process.env.VITE_ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH || "").trim();
}

export function officialUser() {
  return (process.env.VITE_ADMIN_USER || process.env.ADMIN_USER || "administracion").trim();
}

export function expectedSessionToken() {
  const hash = officialPasswordHash();
  return hash ? sha256Hex(`uc-sess:${hash}`) : "";
}

export function readCookie(cookieHeader, name) {
  if (!cookieHeader) return "";
  const part = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

export function sessionFromRequest(req) {
  return readCookie(req.headers?.cookie, "uc_admin");
}

/**
 * Sesión válida si coincide con el hash de entorno (legado) o si es una sesión
 * de servidor emitida tras iniciar sesión con una cuenta de Supabase Auth que es
 * admin del tenant Unidades Chile (tabla tenant_members).
 */
export async function isAdminRequest(req) {
  const token = sessionFromRequest(req);
  if (!token) return false;
  const expected = expectedSessionToken();
  if (expected && token === expected) return true;
  const sb = supabaseAnon();
  if (!sb) return false;
  const { data, error } = await sb.rpc("uc_admin_session_check", { p_token: token });
  return !error && data === true;
}

/** Usuario sin @ = cuenta RG (usuario@boletas.rgmotorschile.cl). */
export function loginEmail(user) {
  const u = String(user || "").trim().toLowerCase();
  return u.includes("@") ? u : `${u}@boletas.rgmotorschile.cl`;
}

export function sessionCookie(token) {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `uc_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}

export function clearSessionCookie() {
  return "uc_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export function deny(res) {
  return res.status(401).json({ ok: false, error: "No autorizado." });
}
