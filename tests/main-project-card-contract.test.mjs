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
