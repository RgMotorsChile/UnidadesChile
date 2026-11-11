import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts", "add-uc-admin-user.mjs");

describe("scripts/add-uc-admin-user.mjs", () => {
  it("exige usuario y archivo, y no escribe un archivo si faltan", () => {
    const dir = mkdtempSync(join(tmpdir(), "uc-admin-"));
    const output = join(dir, "acceso.txt");
    let failed = false;
    try {
      execFileSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    } catch (err) {
      failed = true;
      const text = String(err.stderr || err.stdout || "");
      assert.match(text, /Uso:/);
      assert.doesNotMatch(text, /RgMotors#/);
    }
    assert.equal(failed, true);
    assert.equal(existsSync(output), false);
  });

  it("no modifica cuentas protegidas y no escribe contraseña", () => {
    const dir = mkdtempSync(join(tmpdir(), "uc-admin-"));
    const output = join(dir, "acceso.txt");
    let failed = false;
    try {
      execFileSync(process.execPath, [SCRIPT, "mathias.jara", output], {
        encoding: "utf8",
        cwd: ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      failed = true;
      const text = String(err.stderr || err.stdout || "");
      assert.match(text, /no se modifica/i);
      assert.doesNotMatch(text, /RgMotors#/);
      assert.doesNotMatch(text, /Contraseña temporal:/);
    }
    assert.equal(failed, true);
    assert.equal(existsSync(output), false);
  });
});
