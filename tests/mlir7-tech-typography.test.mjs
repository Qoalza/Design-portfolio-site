import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const globals = read("../src/app/globals.css");
const home = read("../src/app/page.module.css");
const projects = read("../src/app/projects/page.module.css");
const card = read("../src/components/main-project-card.module.css");
const header = read("../src/components/page-header.module.css");
const actionBar = read("../src/components/project-action-bar.module.css");
const footer = read("../src/components/site-footer.module.css");

test("MLIR7 exposes the three exact shared Tech typography tokens", () => {
  assert.match(globals, /--type-tech-font-family:\s*"Source Code Pro", monospace/);
  assert.match(globals, /--type-tech-font-weight:\s*400/);
  assert.match(globals, /--type-tech-s-font-size:\s*12px/);
  assert.match(globals, /--type-tech-s-line-height:\s*16px/);
  assert.match(globals, /--type-tech-s-letter-spacing:\s*-\.3px/);
  assert.match(globals, /--type-tech-m-font-size:\s*14px/);
  assert.match(globals, /--type-tech-m-line-height:\s*16px/);
  assert.match(globals, /--type-tech-m-letter-spacing:\s*-\.5px/);
  assert.match(globals, /--type-tech-l-font-size:\s*16px/);
  assert.match(globals, /--type-tech-l-line-height:\s*20px/);
  assert.match(globals, /--type-tech-l-letter-spacing:\s*-\.6px/);
  assert.match(globals, /--type-tech-s-features:[^;]*"zero" 1/);
  assert.match(globals, /--type-tech-m-features:[^;]*"zero" 1/);
  assert.match(globals, /--type-tech-l-features:[^;]*"zero" 1/);
});

test("MLIR7 maps every confirmed Tech consumer to Source Code Pro and slashed zero", () => {
  for (const [name, css, selectors] of [
    ["home", home, [".heroTags", ".projectTags", ".updated", ".processEyebrow", ".toolTags span", ".eyeconTags span", ".freelanceTags"]],
    ["projects", projects, [".projectTags", ".updated"]],
    ["card", card, [".tags", ".updated"]],
    ["header", header, [".tags"]],
    ["action bar", actionBar, [".updatedAt"]],
    ["footer", footer, [".footer"]],
  ]) {
    for (const selector of selectors) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const block = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
      assert.match(block, /Source Code Pro|--type-tech-font-family/, `${name} ${selector} must use Tech font`);
      assert.match(block, /zero|--type-tech-[sml]-features/, `${name} ${selector} must enable slashed zero`);
      assert.doesNotMatch(block, /"Onest"/, `${name} ${selector} must not retain Onest`);
    }
  }
});

test("MLIR7 preserves instance-specific Figma feature sets", () => {
  assert.match(home, /\.heroTags\s*\{[^}]*"ss04" 1[^}]*"ss05" 1[^}]*"case" 1[^}]*"zero" 1/s);
  assert.match(home, /\.processEyebrow\s*\{[^}]*--type-tech-l-features/s);
  assert.match(home, /\.toolTags span\s*\{[^}]*--type-tech-s-features/s);
  assert.match(footer, /\.footer\s*\{[^}]*--type-tech-s-features/s);
});

test("MLIR7 keeps ordinary Body and Heading families unchanged", () => {
  assert.match(globals, /body\s*\{[^}]*font-family:\s*"Onest"/s);
  assert.match(home, /\.hero h1\s*\{[^}]*font-family:\s*"Google Sans"/s);
  assert.match(home, /\.sectionHeading h2\s*\{[^}]*font-family:\s*"Google Sans"/s);
});
