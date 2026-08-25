import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateErrorStageScale } from "../src/lib/error-layout.ts";

const component = readFileSync(new URL("../src/components/error-stage.tsx", import.meta.url), "utf8");
const screenStyles = readFileSync(new URL("../src/components/error-screen.module.css", import.meta.url), "utf8");

test("404 stage scale preserves the 1200 by 900 Figma geometry above the footer", () => {
  assert.equal(calculateErrorStageScale(960), 1);
  assert.equal(calculateErrorStageScale(900), 840 / 900);
  assert.equal(calculateErrorStageScale(720), 660 / 900);
  assert.equal(calculateErrorStageScale(1200), 1);
});

test("invalid measurements retain the safe unscaled geometry", () => {
  assert.equal(calculateErrorStageScale(Number.NaN), 1);
  assert.equal(calculateErrorStageScale(900, 60, 0), 1);
});

test("runtime scale is recalculated without relying on CSS trigonometry", () => {
  assert.match(component, /useLayoutEffect/);
  assert.match(component, /calculateErrorStageScale\(window\.innerHeight\)/);
  assert.match(component, /addEventListener\("resize", updateScale/);
  assert.match(component, /data-error-stage/);
});

test("404 message typography follows the exact current Figma node", () => {
  assert.match(screenStyles, /\.copy\s*\{[^}]*font-family:\s*"Google Sans"/);
  assert.match(screenStyles, /\.message a,\.message button\s*\{[^}]*font:[^;]*"Google Sans"/);
});
