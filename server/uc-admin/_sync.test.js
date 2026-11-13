import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./_sync.ts", import.meta.url), "utf8");

test("el botón de sync solo dispara el cron de RG y no purga fotos", () => {
  assert.equal(source.includes("purgeCarsMissingFromSheet"), false);
  assert.equal(source.includes("removed"), false);
  assert.match(source, /www\.rgmotorschile\.cl\/api\/cron\/sync\?tenant=unidades-chile/);
  assert.match(source, /CRON_SECRET/);
});
