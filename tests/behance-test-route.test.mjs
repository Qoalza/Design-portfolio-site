import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/behance-test/page.tsx", import.meta.url), "utf8");
const widget = readFileSync(new URL("../src/components/behance-test-widget.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/components/behance-test-widget.module.css", import.meta.url), "utf8");

test("Behance test route renders an isolated interactive widget", () => {
  assert.match(page, /BehanceTestWidget/);
  assert.match(widget, /onPointerMove/);
  assert.match(widget, /onPointerLeave/);
  assert.match(widget, /aria-describedby/);
  assert.match(styles, /--pointer-x/);
  assert.match(styles, /overflow:\s*hidden/);
});

test("Behance test widget exposes the two requested external destinations", () => {
  assert.match(widget, /const CORVO_URL = "https:\/\/art-des\.ru\/projects\/corvo"/);
  assert.match(widget, /const PORTFOLIO_URL = "https:\/\/art-des\.ru"/);
  assert.match(widget, /<ControlButton external href=\{CORVO_URL\}/);
  assert.match(widget, /<TextButton external href=\{PORTFOLIO_URL\}/);
  assert.match(widget, /external/);
  assert.match(widget, /Открыть кейс Corvo/);
  assert.match(widget, /Перейти на art-des\.ru/);
});

test("Behance test widget remains usable in a narrow or motion-reduced iframe", () => {
  assert.match(styles, /min-height:\s*520px/);
  assert.match(styles, /@media \(max-width:\s*720px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)/);
});
