import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateTempPassword, validateStrongPassword } from "./adminPassword.mjs";

describe("validateStrongPassword", () => {
  it("acepta una contraseña fuerte y la temporal generada", () => {
    assert.equal(validateStrongPassword("RgMotors#2026!x"), null);
    assert.equal(validateStrongPassword(generateTempPassword()), null);
  });

  it("rechaza contraseñas débiles", () => {
    assert.ok(validateStrongPassword("corta"));
    assert.ok(validateStrongPassword("solominusculas1!"));
    assert.ok(validateStrongPassword("SOLOMAYUSCULAS1!"));
    assert.ok(validateStrongPassword("SinNumeros!!"));
    assert.ok(validateStrongPassword("SinSimbolo12"));
  });
});
