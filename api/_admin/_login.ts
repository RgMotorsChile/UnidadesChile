import { createClient } from "@supabase/supabase-js";
import { validateStrongPassword } from "../../shared/adminPassword.mjs";
import {
  deny,
  loginEmail,
  expectedSessionToken,
  officialPasswordHash,
  officialUser,
  sessionCookie,
  sessionUserState,
  sha256Hex,
} from "./_auth.js";
import { SUPABASE_URL, anonKey, supabaseAdmin, supabaseAnon } from "./_db.js";

/** Cuenta RG (Supabase Auth) con rol admin en el tenant Unidades Chile. */
async function supabaseSession(user: string, password: string) {
  const anon = supabaseAnon();
  if (!anon || !user || !password) return { token: "", mustChange: false };
  const { data, error } = await anon.auth.signInWithPassword({ email: loginEmail(user), password });
  const access = data?.session?.access_token;
  if (error || !access) return { token: "", mustChange: false };
  const mustChange = data.user?.user_metadata?.must_change_password === true;
  const authed = createClient(SUPABASE_URL, anonKey(), {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${access}` } },
  });
  const { data: token, error: rpcError } = await authed.rpc("uc_admin_session_create");
  await anon.auth.signOut().catch(() => undefined);
  if (rpcError || typeof token !== "string") return { token: "", mustChange: false };
  return { token, mustChange };
}

export const config = { runtime: "nodejs" };

type Body = {
  action?: string;
  user?: string;
  password?: string;
  currentPassword?: string;
  newPassword?: string;
};

export default async function handler(
  req: { method?: string; body?: Body; headers?: { cookie?: string } },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (code: number) => { json: (body: unknown) => void };
  },
) {
  try {
    if (req.method === "GET") {
      const state = await sessionUserState(req);
      if (!state.ok) return res.status(401).json({ ok: false });
      return res.status(200).json({ ok: true, mustChange: state.mustChange, legacy: state.legacy });
    }
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Método no permitido." });
    }

    const action = String(req.body?.action || "login");
    if (action === "change") {
      const user = String(req.body?.user || "").trim();
      const currentPassword = String(req.body?.currentPassword || "");
      const newPassword = String(req.body?.newPassword || "");
      if (!user || !currentPassword || !newPassword) {
        return res.status(400).json({ ok: false, error: "Completa la contraseña actual y la nueva." });
      }
      const passErr = validateStrongPassword(newPassword);
      if (passErr) return res.status(400).json({ ok: false, error: passErr });

      const officialHash = officialPasswordHash();
      if (officialHash && user === officialUser() && sha256Hex(`uc-pw:${currentPassword}`) === officialHash) {
        return res.status(400).json({
          ok: false,
          error: "Esta cuenta oficial no cambia la contraseña desde el panel.",
        });
      }

      const session = await supabaseSession(user, currentPassword);
      if (!session.token) return deny(res);

      const anon = supabaseAnon();
      if (!anon) return res.status(500).json({ ok: false, error: "No se pudo actualizar la contraseña." });
      const { data, error } = await anon.auth.signInWithPassword({
        email: loginEmail(user),
        password: currentPassword,
      });
      if (error || !data.user || !data.session?.access_token) return deny(res);

      const admin = supabaseAdmin();
      if (admin) {
        const { error: updError } = await admin.auth.admin.updateUserById(data.user.id, {
          password: newPassword,
          user_metadata: { ...(data.user.user_metadata || {}), must_change_password: false },
        });
        await anon.auth.signOut().catch(() => undefined);
        if (updError) {
          return res.status(500).json({ ok: false, error: "No se pudo guardar la nueva contraseña." });
        }
      } else {
        const authed = createClient(SUPABASE_URL, anonKey(), {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
        });
        const { error: updError } = await authed.auth.updateUser({
          password: newPassword,
          data: { must_change_password: false },
        });
        await anon.auth.signOut().catch(() => undefined);
        if (updError) {
          return res.status(500).json({ ok: false, error: "No se pudo guardar la nueva contraseña." });
        }
      }

      res.setHeader("Set-Cookie", sessionCookie(session.token));
      return res.status(200).json({ ok: true, user, mustChange: false });
    }

    const user = String(req.body?.user || "").trim();
    const password = String(req.body?.password || "");
    // Primero la cuenta RG (Supabase Auth): crea fila en uc_admin_sessions y
    // permite guardar fotos vía RPC sin service role.
    const session = await supabaseSession(user, password);
    if (!session.token) {
      const hash = officialPasswordHash();
      if (hash && user === officialUser() && sha256Hex(`uc-pw:${password}`) === hash) {
        res.setHeader("Set-Cookie", sessionCookie(expectedSessionToken()));
        return res.status(200).json({ ok: true, user, legacy: true, mustChange: false });
      }
      return deny(res);
    }
    res.setHeader("Set-Cookie", sessionCookie(session.token));
    return res.status(200).json({ ok: true, user, mustChange: session.mustChange });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Error de login.",
    });
  }
}
