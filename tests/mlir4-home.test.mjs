import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/page.module.css", import.meta.url), "utf8");

test("Hero eyebrow uses the current one-line Google Sans typography", () => {
  assert.match(page, /className=\{styles\.eyebrow\}>PRODUCT DESIGNER<\/p>/);
  assert.match(styles, /\.eyebrow\s*\{[\s\S]*gap:\s*12px;[\s\S]*font-family:\s*"Google Sans"/);
  assert.match(styles, /\.eyebrow\s*\{[\s\S]*font-size:\s*14px;[\s\S]*font-weight:\s*500;[\s\S]*line-height:\s*20px;/);
  assert.match(styles, /\.eyebrow\s*\{[\s\S]*white-space:\s*nowrap;/);
  assert.doesNotMatch(styles, /\.eyebrow > span\s*\{[^}]*width:/);
});

test("Codex AI action uses the current shared disabled Large TextButton", () => {
  const action = page.match(/<TextButton[\s\S]*?Скоро тут будет файл\s*<\/TextButton>/)?.[0] ?? "";
  assert.match(action, /size="large"/);
  assert.match(action, /disabled/);
  assert.doesNotMatch(action, /href=|external/);
});
