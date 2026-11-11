/**
 * Crea UN admin de Unidades Chile en Supabase Auth + tenant_members.
 * No modifica otras cuentas ni escribe credenciales de entorno.
 *
 *   node scripts/add-uc-admin-user.mjs <username> <archivo-salida>
 *
 * La contraseña temporal se escribe SOLO en el archivo de salida, nunca a stdout.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { generateTempPassword, validateStrongPassword } from "../shared/adminPassword.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const UC_TENANT = "unidades-chile";
const PROTECTED = new Set([
  "mathias.jara@boletas.rgmotorschile.cl",
  "administracion@rgmotorschile.cl",
  "fernando.salgado@boletas.rgmotorschile.cl",
  "fernando.salgado@rgmotorschile.cl",
]);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) {
      const key = t.slice(0, i).trim();
      if (process.env[key]) continue;
      process.env[key] = t
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env"));

function loginEmail(user) {
  const u = String(user || "").trim().toLowerCase();
  return u.includes("@") ? u : `${u}@boletas.rgmotorschile.cl`;
}

function parseArgs(argv) {
  const positional = argv.slice(2).filter((a) => !a.startsWith("--"));
  return { username: positional[0] || "", outputFile: positional[1] || "" };
}

function getAdminClient() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!url || !key || key === "[SENSITIVE]" || key.length < 30) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const { username, outputFile } = parseArgs(process.argv);
  if (!username || !outputFile) {
    console.error("Uso: node scripts/add-uc-admin-user.mjs <username> <archivo-salida>");
    process.exit(1);
  }
  const email = loginEmail(username);
  if (PROTECTED.has(email)) {
    console.error("Esa cuenta ya existe y no se modifica desde este script.");
    process.exit(1);
  }
  const password = generateTempPassword();
  const passErr = validateStrongPassword(password);
  if (passErr) {
    console.error("No se pudo generar una contraseña válida.");
    process.exit(1);
  }

  const admin = getAdminClient();
  if (!admin) {
    console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", UC_TENANT)
    .maybeSingle();
  if (tenantError || !tenant?.id) {
    console.error("No se encontró el tenant de Unidades Chile.");
    process.exit(1);
  }

  const { data: existing } = await admin.auth.admin.listUsers();
  const already = (existing?.users || []).find((u) => (u.email || "").toLowerCase() === email);
  if (already) {
    console.error("Ese usuario ya existe en Auth y este script no pisa su contraseña.");
    process.exit(1);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });
  if (createError || !created.user?.id) {
    console.error("No se pudo crear el usuario.");
    process.exit(1);
  }

  const { error: memberError } = await admin.from("tenant_members").insert({
    tenant_id: tenant.id,
    user_id: created.user.id,
    role: "admin",
    active: true,
  });
  if (memberError) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
    console.error("No se pudo asignar el rol admin. No se dejó el usuario a medias.");
    process.exit(1);
  }

  const dest = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const body = [
    "Panel: https://www.unidadeschile.cl/admin/login",
    `Usuario: ${username.trim()}`,
    `Contraseña temporal: ${password}`,
    "Debes cambiar la contraseña en el primer ingreso.",
    "",
  ].join("\n");
  fs.writeFileSync(dest, body, { encoding: "utf8", mode: 0o600 });
  console.log(`Usuario listo: ${username.trim()}`);
  console.log(`Contraseña escrita en: ${dest}`);
}

main().catch(() => {
  console.error("Error inesperado.");
  process.exit(1);
});
