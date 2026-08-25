import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/page.module.css", import.meta.url), "utf8");

test("AI fact uses the current single-line information panel", () => {
  const fact = page.match(/<aside className=\{styles\.aiFact\}[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.doesNotMatch(fact, /Интересный факт/);
  assert.match(fact, /Вся разработка данного сайта, кроме дизайна, была полностью выполнена мной в Codex, с нуля/);
  assert.match(fact, /<span className=\{styles\.aiFactIcon\}/);
  assert.match(fact, /className=\{styles\.aiFactDivider\}/);
  const figmaAction = fact.match(/<TextButton[\s\S]*?<\/TextButton>/)?.[0] ?? "";
  assert.match(figmaAction, /size="large"/);
  assert.match(figmaAction, /variant="neutralAccent"/);
  assert.match(figmaAction, />\s*Figma\s*<\/TextButton>/);
});

test("AI fact geometry follows the current Figma instance", () => {
  assert.match(styles, /\.aiFact\s*\{[\s\S]*gap:\s*16px;[\s\S]*padding:\s*32px 24px 0 32px;/);
  assert.match(styles, /\.aiFactIcon\s*\{[\s\S]*width:\s*20px;[\s\S]*height:\s*20px;/);
  assert.match(styles, /\.aiFactDivider\s*\{[\s\S]*width:\s*1px;[\s\S]*align-self:\s*stretch;/);
});
