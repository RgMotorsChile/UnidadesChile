import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesOfficialAdmin, shouldTryServerLogin } from "./adminLoginFlow.ts";

const official = { user: "rg.mathias", passwordHash: "abc" };

describe("login de varios admins", () => {
  it("reconoce la cuenta oficial sin abrir el camino de servidor", () => {
    assert.equal(matchesOfficialAdmin(official, "rg.mathias", "abc"), true);
    assert.equal(shouldTryServerLogin(official, "rg.mathias", "abc"), false);
  });

  it("si hay cuenta oficial, otro usuario igual puede ir al servidor", () => {
    assert.equal(matchesOfficialAdmin(official, "rg.fernando", "abc"), false);
    assert.equal(shouldTryServerLogin(official, "rg.fernando", "cualquier-hash"), true);
  });

  it("sin credencial oficial, todo login va al servidor", () => {
    assert.equal(shouldTryServerLogin(null, "rg.fernando", "x"), true);
    assert.equal(shouldTryServerLogin(null, "", "x"), false);
  });
});
