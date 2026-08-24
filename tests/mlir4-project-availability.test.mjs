import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
test("only Corvo exposes an available project detail route", () => {
  const corvo = readFileSync(new URL("../content/projects/corvo.mdx", import.meta.url), "utf8");
  const sarafan = readFileSync(new URL("../content/projects/sarafan-radio.mdx", import.meta.url), "utf8");
  const boff = readFileSync(new URL("../content/projects/boff.mdx", import.meta.url), "utf8");
  assert.match(corvo, /detailAvailable:\s*true/);
  assert.match(sarafan, /detailAvailable:\s*false/);
  assert.match(boff, /detailAvailable:\s*false/);
  const projects = readFileSync(new URL("../src/lib/projects.ts", import.meta.url), "utf8");
  assert.match(projects, /export type ProjectAvailability/);
  assert.match(projects, /detail:\s*detailAvailable \? "available" : "unavailable"/);
});

test("the project route rejects unavailable content through the shared availability contract", () => {
  const page = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /project\.availability\.detail !== "available"/);
  assert.doesNotMatch(page, /project\.detailAvailable/);
});

test("disabled project detail uses the shared Tooltip and exact current copy", () => {
  const detail = readFileSync(new URL("../src/components/project-detail-control.tsx", import.meta.url), "utf8");
  assert.match(detail, /<Tooltip/);
  assert.match(detail, /Вот-вот, горяченькое несу уже!/);
  assert.match(detail, /\/assets\/projects\/rocket\.svg/);
  assert.match(detail, /availability:\s*Extract<ProjectAvailability\["detail"\],\s*"unavailable">/);
  assert.match(detail, /disabled>Скоро<\/ControlButton>/);
});

test("Tooltip keeps disabled triggers keyboard-accessible and links content semantically", () => {
  const tooltip = readFileSync(new URL("../src/components/tooltip.tsx", import.meta.url), "utf8");
  const tooltipStyles = readFileSync(new URL("../src/components/tooltip.module.css", import.meta.url), "utf8");
  assert.match(tooltip, /aria-describedby/);
  assert.match(tooltip, /role="tooltip"/);
  assert.match(tooltip, /tabIndex=\{0\}/);
  assert.match(tooltip, /pointerdown/);
  assert.match(tooltipStyles, /transition:\s*opacity 150ms/);
  assert.match(tooltipStyles, /flex:\s*0 0 24px/);
});
