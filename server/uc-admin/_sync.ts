import { deny, isAdminRequest } from "./_auth.js";
import {
  CATALOG_AUTOMATION_MESSAGE,
  CATALOG_AUTOMATION_STATUS,
} from "../../shared/catalogAutomation.mjs";

export const config = { runtime: "nodejs" };

export default async function handler(
  req: { method?: string; headers?: { cookie?: string } },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método no permitido." });
  if (!(await isAdminRequest(req))) return deny(res);

  // No purga autos ni dispara el cron de RG. El inventario actual no se toca.
  return res.status(CATALOG_AUTOMATION_STATUS).json({
    ok: false,
    disabled: true,
    error: CATALOG_AUTOMATION_MESSAGE,
    message: CATALOG_AUTOMATION_MESSAGE,
  });
}
