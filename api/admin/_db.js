import { createClient } from "@supabase/supabase-js";

export const UC_TENANT = "unidades-chile";
export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://tuybpizjeszgwtcvunmp.supabase.co";

export function supabaseAdmin() {
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";
  if (!service) return null;
  return createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
}

export function supabaseAnon() {
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";
  if (!anon) return null;
  return createClient(SUPABASE_URL, anon, { auth: { persistSession: false } });
}

export async function tenantId(sb) {
  const { data, error } = await sb.from("tenants").select("id").eq("slug", UC_TENANT).maybeSingle();
  if (error || !data) return null;
  return String(data.id);
}
