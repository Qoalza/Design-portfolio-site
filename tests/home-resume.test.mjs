import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/page.module.css", import.meta.url), "utf8");

test("Resume keeps the exact current Figma skill-tag inventory", () => {
  const tagBlock = page.match(/className=\{styles\.eyeconTags\}>([\s\S]*?)<\/div>/)?.[1] ?? "";
  assert.deepEqual(
    [...tagBlock.matchAll(/<span>([^<]+)<\/span>/g)].map((match) => match[1]),
    ["B2B", "Design Systems", "User Flow", "CJM", "Wireframes", "UX Research"],
  );
});

test("Resume contacts use the current Figma slash separator", () => {
  assert.match(page, /<span aria-hidden="true">\/<\/span>/);
});

test("Resume CTA keeps the current Full CV label and destination", () => {
  assert.match(page, /href="https:\/\/disk\.yandex\.ru\/i\/iZ1UWgbO1LAOPw"[\s\S]*>Полное CV<\/ControlButton>/);
  assert.doesNotMatch(page, />Скачать полное CV<\/ControlButton>/);
});

test("Resume experience typography and tag surfaces follow the current Figma contract", () => {
  assert.match(styles, /\.eyeconDetails h3,[\s\S]*font-size:\s*24px;[\s\S]*line-height:\s*32px;/);
  assert.match(styles, /\.tenure span\s*\{[\s\S]*font-size:\s*24px;[\s\S]*line-height:\s*32px;/);
  assert.match(styles, /\.eyeconTags span\s*\{[\s\S]*background:\s*#f7f9fa;/);
  assert.match(styles, /\.eyeconTags span\s*\{[\s\S]*border:\s*1px solid #f0f1f2;/);
});
