import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("homepage process uses versioned direct exports from the three exact Figma nodes", async () => {
  const page = await source("src/app/page.tsx");

  assert.match(page, /process-discovery-515-30749\.png/);
  assert.match(page, /process-prototype-515-30751\.png/);
  assert.match(page, /process-delivery-515-30778\.png/);
  assert.equal((page.match(/unoptimized/g) ?? []).length >= 3, true);
});
