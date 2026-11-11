import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG_AUTOMATION_DISABLED,
  CATALOG_AUTOMATION_MESSAGE,
  CATALOG_AUTOMATION_STATUS,
} from "./catalogAutomation.mjs";

test("la automatización del catálogo queda apagada", () => {
  assert.equal(CATALOG_AUTOMATION_DISABLED, true);
  assert.equal(CATALOG_AUTOMATION_STATUS, 409);
  assert.match(CATALOG_AUTOMATION_MESSAGE, /solo se administra desde el panel/i);
});
