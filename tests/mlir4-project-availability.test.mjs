import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
test("published Corvo and Sarafan expose available project detail routes", () => {
  const readProject = (name) => JSON.parse(readFileSync(new URL(`../content/projects/${name}.json`, import.meta.url), "utf8"));
  assert.equal(readProject("corvo").detailAvailable, true);
  assert.equal(readProject("sarafan-radio").detailAvailable, true);
  assert.equal(readProject("boff").detailAvailable, false);
  const projects = readFileSync(new URL("../src/lib/projects.ts", import.meta.url), "utf8");
  assert.match(projects, /export type ProjectAvailability/);
  assert.match(projects, /detail:\s*project\.detailAvailable \? "available" : "unavailable"/);
});

test("published Sarafan.Radio exposes its completed project and available file", () => {
  const sarafan = JSON.parse(readFileSync(new URL("../content/projects/sarafan-radio.json", import.meta.url), "utf8"));
  assert.equal(sarafan.detailAvailable, true);
  assert.equal(sarafan.visibility, "published");
  assert.equal(sarafan.materials.projectState, "completed");
  assert.equal(sarafan.materials.fileState, "available");
  assert.match(sarafan.materials.figmaUrl, /^https:\/\/www\.figma\.com\//);
});

test("project cards share the unavailable-versus-absent file contract", () => {
  const fileControl = readFileSync(new URL("../src/components/project-file-control.tsx", import.meta.url), "utf8");
  assert.match(fileControl, /fileState === "available"/);
  assert.match(fileControl, /fileState === "unavailable"/);
  assert.match(fileControl, /Файл пока недоступен/);
  assert.match(fileControl, /project-info\.svg/);
  assert.doesNotMatch(fileControl, /У проекта нет отдельного файла/);

  for (const file of [
    "../src/app/page.tsx",
    "../src/app/projects/page.tsx",
    "../src/components/main-project-card.tsx",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(source, /<ProjectFileControl/);
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
