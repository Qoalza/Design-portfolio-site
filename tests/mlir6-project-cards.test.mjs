import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const paths = {
  main: "../src/components/main-project-card.module.css",
  home: "../src/app/page.module.css",
  projects: "../src/app/projects/page.module.css",
  pageHeader: "../src/components/page-header.module.css",
};
const sources = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(new URL(path, import.meta.url), "utf8")]));

test("project detail CTA remains Hug without a forced width contract", () => {
  for (const source of Object.values(sources)) {
    assert.doesNotMatch(source, /\.detailsButton\s*\{[^}]*\b(?:width|min-width|flex-grow):/s);
  }
});

test("project tags use the exact Source Code Pro technology style", () => {
  for (const key of ["main", "home", "projects", "pageHeader"]) {
    assert.match(sources[key], /font:\s*400 14px\/16px "Source Code Pro", monospace/);
    assert.match(sources[key], /font-feature-settings:\s*"ss02" 1, "cv01" 1, "cv12" 1, "cv14" 1, "cv17" 1/);
    assert.match(sources[key], /letter-spacing:\s*-.5px/);
  }
});

test("card Update info is a 40px padded Source Code Pro frame", () => {
  for (const key of ["main", "home", "projects"]) {
    assert.match(sources[key], /\.updated\s*\{[^}]*height:\s*40px;[^}]*padding:\s*0 16px;[^}]*font:\s*400 14px\/16px "Source Code Pro"/s);
  }
});
