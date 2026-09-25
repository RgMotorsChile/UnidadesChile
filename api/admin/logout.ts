import { clearSessionCookie } from "./_lib";

export default async function handler(
  req: { method?: string },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (code: number) => { json: (body: unknown) => void };
  },
) {
  if (req.method && req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }
  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(200).json({ ok: true });
}
