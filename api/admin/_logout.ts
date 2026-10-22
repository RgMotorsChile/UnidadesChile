import { clearSessionCookie, sessionFromRequest } from "./_auth.js";
import { supabaseAnon } from "./_db.js";

export const config = { runtime: "nodejs" };

export default async function handler(
  req: { method?: string; headers?: { cookie?: string } },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (code: number) => { json: (body: unknown) => void };
  },
) {
  if (req.method && req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }
  const token = sessionFromRequest(req);
  const anon = supabaseAnon();
  if (token && anon) await anon.rpc("uc_admin_session_end", { p_token: token });
  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(200).json({ ok: true });
}
