import {
  deny,
  expectedSessionToken,
  officialPasswordHash,
  officialUser,
  sessionCookie,
  sha256Hex,
} from "./_lib";

type Body = { user?: string; password?: string };

export default async function handler(
  req: { method?: string; body?: Body; headers?: { cookie?: string } },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (code: number) => { json: (body: unknown) => void };
  },
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  }
  const user = String(req.body?.user || "").trim();
  const password = String(req.body?.password || "");
  const hash = officialPasswordHash();
  if (!hash) return deny(res);
  if (user !== officialUser()) return deny(res);
  if (sha256Hex(`uc-pw:${password}`) !== hash) return deny(res);
  res.setHeader("Set-Cookie", sessionCookie(expectedSessionToken()));
  return res.status(200).json({ ok: true, user });
}
