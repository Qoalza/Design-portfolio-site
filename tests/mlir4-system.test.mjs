import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globals = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const controls = readFileSync(new URL("../src/components/ui-controls.tsx", import.meta.url), "utf8");
const controlStyles = readFileSync(new URL("../src/components/ui-controls.module.css", import.meta.url), "utf8");

test("current Body Medium L and M typography tokens preserve the Figma metrics", () => {
  assert.match(globals, /--type-body-l-medium:\s*500 16px\/20px "Onest", sans-serif;/);
  assert.match(globals, /--type-body-l-medium-letter-spacing:\s*-\.2px;/);
  assert.match(globals, /--type-body-m-medium:\s*500 14px\/16px "Onest", sans-serif;/);
  assert.match(globals, /--type-body-m-medium-letter-spacing:\s*-\.1px;/);
});

test("TextButton exposes the current Large component size", () => {
  assert.match(controls, /size\?:\s*"small" \| "medium" \| "large"/);
  assert.match(controls, /textLarge/);
  assert.match(controlStyles, /\.textLarge\s*\{[\s\S]*font:\s*400 16px\/20px "Onest", sans-serif;/);
  assert.match(controlStyles, /\.textLarge\s*\{[\s\S]*letter-spacing:\s*-\.2px;/);
  assert.match(controlStyles, /\.textLarge\s*\{[\s\S]*gap:\s*8px;/);
  assert.match(controlStyles, /\.textLarge \.icon\s*\{[\s\S]*width:\s*20px;/);
});
