import { createHash } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const UC_TENANT = "unidades-chile";
export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://tuybpizjeszgwtcvunmp.supabase.co";

export function sha256Hex(text: string) {
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

export function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return "";
  const part = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

export function isAdminRequest(req: { headers?: { cookie?: string } }) {
  const token = readCookie(req.headers?.cookie, "uc_admin");
  const expected = expectedSessionToken();
  return Boolean(token && expected && token === expected);
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `uc_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}

export function clearSessionCookie() {
  return "uc_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export function supabaseAdmin(): SupabaseClient | null {
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";
  if (!service) return null;
  return createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
}

export function supabaseAnon(): SupabaseClient | null {
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";
  if (!anon) return null;
  return createClient(SUPABASE_URL, anon, { auth: { persistSession: false } });
}

export async function tenantId(sb: SupabaseClient) {
  const { data, error } = await sb.from("tenants").select("id").eq("slug", UC_TENANT).maybeSingle();
  if (error || !data) return null;
  return String((data as { id: string }).id);
}

export type JsonRes = {
  status: (code: number) => { json: (body: unknown) => void; setHeader?: (k: string, v: string) => void };
  setHeader: (k: string, v: string) => void;
};

export function deny(res: JsonRes) {
  return res.status(401).json({ ok: false, error: "No autorizado." });
}
