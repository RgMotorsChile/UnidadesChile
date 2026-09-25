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

export function isAdminRequest(req) {
  const token = readCookie(req.headers?.cookie, "uc_admin");
  const expected = expectedSessionToken();
  return Boolean(token && expected && token === expected);
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
