import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(
  new URL("../src/components/main-project-card.tsx", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("../src/components/main-project-card.module.css", import.meta.url),
  "utf8",
);
const homePage = readFileSync(
  new URL("../src/app/page.tsx", import.meta.url),
  "utf8",
);
const projectsPage = readFileSync(
  new URL("../src/app/projects/page.tsx", import.meta.url),
  "utf8",
);

test("home and projects use the same MainProjectCard contract", () => {
  assert.match(homePage, /<MainProjectCard/);
  assert.match(projectsPage, /<MainProjectCard/);
});

test("update info keeps its own 40px Figma frame beside the separator", () => {
  assert.match(component, /className=\{styles\.actionDivider\}/);
  assert.match(component, /className=\{styles\.updated\}/);
  assert.match(styles, /\.updated\s*\{[\s\S]*height:\s*40px;/);
  assert.match(styles, /\.updated\s*\{[\s\S]*padding:\s*0 16px;/);
});

test("project copy keeps Hug height and exactly 32px from details to devices", () => {
  const projectsStyles = readFileSync(
    new URL("../src/app/projects/page.module.css", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(styles, /\.detail:last-child dd\s*\{[\s\S]*min-height/);
  assert.match(styles, /\.card\s*\{[\s\S]*align-items:\s*center;/);
  assert.match(styles, /\.copy\s*\{[\s\S]*gap:\s*32px;/);
  assert.match(projectsStyles, /\.copy\s*\{[\s\S]*gap:\s*32px;/);
  assert.match(projectsStyles, /\.compactGrid\s*\{[\s\S]*align-items:\s*center;/);
});

test("unavailable project details use the shared disabled Soon contract", () => {
  const detailControl = readFileSync(
    new URL("../src/components/project-detail-control.tsx", import.meta.url),
    "utf8",
  );

  assert.match(component, /<ProjectDetailControl/);
  assert.match(homePage, /<ProjectDetailControl/);
  assert.match(projectsPage, /<ProjectDetailControl/);
  assert.match(detailControl, /availability:\s*Extract<ProjectAvailability\["detail"\], "unavailable">/);
  assert.match(detailControl, /disabled>Скоро<\/ControlButton>/);
  assert.match(detailControl, /availability:\s*Extract<ProjectAvailability\["detail"\], "available">/);
  assert.match(detailControl, />\s*Подробнее\s*<\/ControlButton>/);
});
