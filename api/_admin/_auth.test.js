import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loginEmail, officialUser, sha256Hex } from "./_auth.js";

describe("loginEmail", () => {
  it("arma el correo de Boletas si el usuario no trae @", () => {
    assert.equal(loginEmail("rg.fernando"), "rg.fernando@boletas.rgmotorschile.cl");
    assert.equal(loginEmail("  Mathias.Jara  "), "mathias.jara@boletas.rgmotorschile.cl");
  });

  it("respeta un correo completo", () => {
    assert.equal(loginEmail("fernando.salgado@rgmotorschile.cl"), "fernando.salgado@rgmotorschile.cl");
  });
});

describe("sha256Hex y usuario oficial", () => {
  it("calcula un hash sha256 estable de 64 caracteres", () => {
    assert.equal(sha256Hex("uc-pw:demo").length, 64);
    assert.equal(sha256Hex("uc-pw:demo"), sha256Hex("uc-pw:demo"));
    assert.notEqual(sha256Hex("uc-pw:demo"), sha256Hex("uc-pw:otra"));
  });

  it("el usuario oficial por defecto no se altera si no hay env", () => {
    const prevUser = process.env.VITE_ADMIN_USER;
    const prevAdmin = process.env.ADMIN_USER;
    delete process.env.VITE_ADMIN_USER;
    delete process.env.ADMIN_USER;
    assert.equal(officialUser(), "administracion");
    if (prevUser != null) process.env.VITE_ADMIN_USER = prevUser;
    if (prevAdmin != null) process.env.ADMIN_USER = prevAdmin;
  });
});
