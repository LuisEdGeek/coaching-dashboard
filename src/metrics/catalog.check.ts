/**
 * BU D: three new P0 cards exist.
 * Run: npx tsx src/metrics/catalog.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = readFileSync(new URL("./catalog.ts", import.meta.url), "utf8");
for (const id of ["voice_vs_text", "emails_sent", "coach_loops"]) {
  assert.match(catalog, new RegExp(`id: "${id}"`));
  const block = catalog.slice(catalog.indexOf(`id: "${id}"`), catalog.indexOf(`id: "${id}"`) + 800);
  assert.match(block, /status: "live"/);
}
console.info("catalog.check: ok");
