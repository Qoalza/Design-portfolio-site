import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/app/projects/page.tsx", import.meta.url), "utf8");
const pageStyles = readFileSync(new URL("../src/app/projects/page.module.css", import.meta.url), "utf8");
const platformStyles = readFileSync(new URL("../src/components/project-platforms.module.css", import.meta.url), "utf8");

test("projects catalog preserves the Figma 44px boundary between the main and compact projects", () => {
  assert.match(pageStyles, /\.catalog\s*\{[^}]*gap:\s*44px;/s);
  assert.doesNotMatch(pageStyles, /\.catalog\s*\{[^}]*padding-top:/s);
});

test("compact cards use their own columns around the centered divider", () => {
  assert.match(pageStyles, /\.compactGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(pageStyles, /\.compactGrid\s*\{[^}]*column-gap:\s*129px;/s);
  assert.match(pageStyles, /\.compactCard\s*\{[^}]*width:\s*auto;/s);
  assert.doesNotMatch(pageStyles, /\.compactCard:nth-child\(2\) \.compactVisual\s*\{[^}]*margin-left:/s);
});

test("platform row is a sibling of Info instead of being trapped in its 16px stack", () => {
  assert.match(pageSource, /function ProjectDetails[\s\S]*<>[\s\S]*className=\{styles\.details\}[\s\S]*<ProjectPlatforms[\s\S]*<\/>/);
  assert.doesNotMatch(pageStyles, /\.compactCopy \.details\s*\{[^}]*min-height:/s);
  assert.match(platformStyles, /font:\s*400 14px\/16px "Onest"/);
});

test("B.Off preview is centered vertically as in the current Figma instance", () => {
  assert.match(pageStyles, /\.compactCard:nth-child\(2\) \.browserFrame\s*\{[^}]*top:\s*50%;[^}]*transform:\s*translate\(-50%,\s*-50%\);/s);
});
