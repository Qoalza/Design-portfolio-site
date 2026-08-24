import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageHeader = readFileSync(
  new URL("../src/components/page-header.tsx", import.meta.url),
  "utf8",
);
const projectsPage = readFileSync(
  new URL("../src/app/projects/page.tsx", import.meta.url),
  "utf8",
);
const projectPage = readFileSync(
  new URL("../src/app/projects/[slug]/page.tsx", import.meta.url),
  "utf8",
);
const siteHeaderStyles = readFileSync(
  new URL("../src/components/site-header.module.css", import.meta.url),
  "utf8",
);

test("PageHeader is one explicit component used by both scoped page variants", () => {
  assert.match(pageHeader, /export function PageHeader/);
  assert.match(pageHeader, /showInfo/);
  assert.match(projectsPage, /<PageHeader/);
  assert.match(projectPage, /<PageHeader/);
});

test("PageHeader keeps tags and devices in the same bottom information row", () => {
  assert.match(pageHeader, /className=\{styles\.infoBody\}[\s\S]*ProjectPlatforms/);
  assert.match(pageHeader, /className=\{styles\.tags\}/);
});

test("GeneralHeader keeps the current 1200 by 80 Figma row contract", () => {
  assert.match(siteHeaderStyles, /\.header\s*\{[\s\S]*width: 1200px;[\s\S]*height: 80px;/);
  assert.match(siteHeaderStyles, /\.nav\s*\{[\s\S]*min-width: 388px;[\s\S]*padding: 4px 48px;/);
});
