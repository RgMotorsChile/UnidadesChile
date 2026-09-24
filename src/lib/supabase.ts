/**
 * Cliente Supabase — Unidades Chile (tenant: unidades-chile).
 * Misma DB que RG Motors; pestaña Sheet: UNIDADES CHILE.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const UC_TENANT_SLUG = "unidades-chile";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://tuybpizjeszgwtcvunmp.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_ANON_KEY) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
