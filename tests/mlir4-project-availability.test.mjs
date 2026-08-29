import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
test("only Corvo exposes an available project detail route", () => {
  const readProject = (name) => JSON.parse(readFileSync(new URL(`../content/projects/${name}.json`, import.meta.url), "utf8"));
  assert.equal(readProject("corvo").detailAvailable, true);
  assert.equal(readProject("sarafan-radio").detailAvailable, false);
  assert.equal(readProject("boff").detailAvailable, false);
  assert.equal(readProject("example-project").detailAvailable, false);
  const projects = readFileSync(new URL("../src/lib/projects.ts", import.meta.url), "utf8");
  assert.match(projects, /export type ProjectAvailability/);
  assert.match(projects, /detail:\s*project\.detailAvailable \? "available" : "unavailable"/);
});

test("Sarafan.Radio preserves the pre-admin unavailable states", () => {
  const sarafan = JSON.parse(readFileSync(new URL("../content/projects/sarafan-radio.json", import.meta.url), "utf8"));
  assert.equal(sarafan.detailAvailable, false);
  assert.deepEqual(sarafan.materials, { projectState: "in_progress", fileState: "unavailable" });
});

test("project cards render detail and file availability independently", () => {
  for (const file of [
    "../src/app/page.tsx",
    "../src/app/projects/page.tsx",
    "../src/components/main-project-card.tsx",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /availability\.detail[^]*?availability\.figma === "absent"[^]*?ProjectDetailControl/s);
    assert.match(source, /availability\.figma === "unavailable"/);
    assert.doesNotMatch(source, /У проекта нет отдельного файла/);
  }
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
  assert.match(tooltip, /onTransitionEnd/);
  assert.match(tooltipStyles, /transition:\s*opacity 200ms/);
  assert.match(tooltipStyles, /width:\s*max-content/);
  assert.match(tooltipStyles, /white-space:\s*nowrap/);
  assert.match(tooltipStyles, /flex:\s*0 0 20px/);
});
