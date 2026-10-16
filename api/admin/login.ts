import { createClient } from "@supabase/supabase-js";
import {
  deny,
  isAdminRequest,
  loginEmail,
  expectedSessionToken,
  officialPasswordHash,
  officialUser,
  sessionCookie,
  sha256Hex,
} from "./_auth.js";
import { SUPABASE_URL, anonKey, supabaseAnon } from "./_db.js";

/** Cuenta RG (Supabase Auth) con rol admin en el tenant Unidades Chile. */
async function supabaseSession(user: string, password: string) {
  const anon = supabaseAnon();
  if (!anon || !user || !password) return "";
  const { data, error } = await anon.auth.signInWithPassword({ email: loginEmail(user), password });
  const access = data?.session?.access_token;
  if (error || !access) return "";
  const authed = createClient(SUPABASE_URL, anonKey(), {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${access}` } },
  });
  const { data: token, error: rpcError } = await authed.rpc("uc_admin_session_create");
  await anon.auth.signOut().catch(() => undefined);
  return !rpcError && typeof token === "string" ? token : "";
}

export const config = { runtime: "nodejs" };

type Body = { user?: string; password?: string };

export default async function handler(
  req: { method?: string; body?: Body; headers?: { cookie?: string } },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (code: number) => { json: (body: unknown) => void };
  },
) {
  try {
    if (req.method === "GET") {
      const ok = await isAdminRequest(req);
      return res.status(ok ? 200 : 401).json({ ok });
    }
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Método no permitido." });
    }
    const user = String(req.body?.user || "").trim();
    const password = String(req.body?.password || "");
    // Primero la cuenta RG (Supabase Auth): crea fila en uc_admin_sessions y
    // permite guardar fotos vía RPC sin service role.
    const token = await supabaseSession(user, password);
    if (!token) {
      const hash = officialPasswordHash();
      if (hash && user === officialUser() && sha256Hex(`uc-pw:${password}`) === hash) {
        res.setHeader("Set-Cookie", sessionCookie(expectedSessionToken()));
        return res.status(200).json({ ok: true, user, legacy: true });
      }
      return deny(res);
    }
    res.setHeader("Set-Cookie", sessionCookie(token));
    return res.status(200).json({ ok: true, user });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Error de login.",
    });
  }
}
