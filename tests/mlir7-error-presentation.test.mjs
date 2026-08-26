import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const errorScreen = readFileSync(new URL("../src/components/error-screen.tsx", import.meta.url), "utf8");
const errorAction = readFileSync(new URL("../src/components/error-action-control.tsx", import.meta.url), "utf8");
const errorStyles = readFileSync(new URL("../src/components/error-screen.module.css", import.meta.url), "utf8");
const controlStyles = readFileSync(new URL("../src/components/ui-controls.module.css", import.meta.url), "utf8");
const controls = readFileSync(new URL("../src/components/ui-controls.tsx", import.meta.url), "utf8");
const notFoundPage = readFileSync(new URL("../src/app/not-found.tsx", import.meta.url), "utf8");
const errorPage = readFileSync(new URL("../src/app/error.tsx", import.meta.url), "utf8");

test("404 and 500 actions render through the shared native ControlButton", () => {
  assert.match(errorScreen, /<ErrorActionControl/);
  assert.match(errorAction, /<ControlButton/);
  assert.match(errorAction, /variant="accent"/);
  assert.match(errorAction, /size="large"/);
  assert.match(controls, /if \(onClick\)[\s\S]*?<button/);
  assert.doesNotMatch(errorStyles, /presentationAction|\.action(?:404|500):(?:hover|active|focus)/);
  assert.equal(errorStyles.match(/\.action(?:404|500)\s*\{[^}]+\}/g)?.every((rule) => /^\.action(?:404|500)\s*\{\s*width:\s*\d+px;\s*\}$/.test(rule)), true);
});

test("error routes provide explicit home and full-reload behavior", () => {
  assert.match(notFoundPage, /actionLabel="На главную"/);
  assert.match(notFoundPage, /action="home"/);

  assert.match(errorPage, /actionLabel="Перезагрузить"/);
  assert.match(errorPage, /action="reload"/);
  assert.match(errorAction, /window\.location\.assign\("\/"\)/);
  assert.match(errorAction, /window\.location\.reload\(\)/);
  assert.doesNotMatch(errorAction, /\breset\s*\(/);
});

test("large system button preserves the exact shared Figma geometry and states", () => {
  assert.match(controls, /type ControlSize = "large" \| "medium" \| "small"/);
  assert.match(controlStyles, /\.control\.large\s*\{[^}]*height:\s*48px/);
  assert.match(controlStyles, /\.control\.large\s*\{[^}]*padding:\s*4px 24px/);
  assert.match(controlStyles, /\.control\.large\s*\{[^}]*border-radius:\s*12px/);
  assert.match(controlStyles, /\.control\.large\s*\{[^}]*font:[^;]*"Google Sans"/);
  assert.match(errorStyles, /\.action404\s*\{[^}]*width:\s*144px/);
  assert.match(errorStyles, /\.action500\s*\{[^}]*width:\s*171px/);
  assert.match(controlStyles, /\.accent:hover/);
  assert.match(controlStyles, /\.accent:active/);
  assert.match(controlStyles, /\.control:focus-visible/);
});
