import { createClient } from "@supabase/supabase-js";

export const UC_TENANT = "unidades-chile";
export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://tuybpizjeszgwtcvunmp.supabase.co";

function isUsableKey(value) {
  const key = String(value || "").trim();
  if (key.length < 40) return false;
  if (/^\*+$/.test(key)) return false;
  return true;
}

export function supabaseAdmin() {
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";
  if (!isUsableKey(service)) return null;
  return createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
}

export function supabaseAnon() {
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!isUsableKey(anon)) return null;
  return createClient(SUPABASE_URL, anon, { auth: { persistSession: false } });
}

export function dbReader() {
  return supabaseAdmin() || supabaseAnon();
}

export async function tenantId(sb) {
  const clients = [sb, supabaseAnon()].filter(Boolean);
  const seen = new Set();
  for (const client of clients) {
    if (seen.has(client)) continue;
    seen.add(client);
    const { data, error } = await client.from("tenants").select("id").eq("slug", UC_TENANT).maybeSingle();
    if (!error && data) return String(data.id);
  }
  return null;
}
