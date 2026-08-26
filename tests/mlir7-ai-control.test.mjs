import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

test("MLIR7 AI control is the exact disabled Large Neutral+Accent TextButton", () => {
  const fact = page.match(/<aside className=\{styles\.aiFact\}[\s\S]*?<\/aside>/)?.[0] ?? "";
  const action = fact.match(/<TextButton[\s\S]*?<\/TextButton>/)?.[0] ?? "";

  assert.match(action, /size="large"/);
  assert.match(action, /variant="neutralAccent"/);
  assert.match(action, /disabled/);
  assert.match(action, /iconLeft="\/assets\/homepage\/figma-light\.svg"/);
  assert.match(action, />\s*Скоро тут будет файл\s*<\/TextButton>/);
  assert.doesNotMatch(action, /href=|external|iconRight=|>\s*Figma\s*</);
});
