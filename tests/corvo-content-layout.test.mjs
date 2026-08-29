import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

async function pngSize(path) {
  const bytes = await readFile(new URL(path, root));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("Corvo exposes the five current Figma information sections in order", async () => {
  const project = JSON.parse(await source("content/projects/corvo.json"));
  const headings = project.content.filter((block) => block.type === "section").map((block) => block.heading);

  assert.deepEqual(headings, ["О проекте", "Задача", "Процесс", "Система", "Результат"]);
});

test("Corvo uses code-built canvases and no stale full-frame project screenshots", async () => {
  const project = JSON.parse(await source("content/projects/corvo.json"));
  const sourceDocument = JSON.stringify(project);

  for (const presentation of ["quotes", "process", "controls"]) {
    assert.ok(project.content.some((section) => section.type === "section" && section.blocks.some((block) => block.type === "image" && block.presentation === presentation)));
  }
  assert.ok(project.content.some((section) => section.type === "section" && section.blocks.some((block) => block.type === "notice" && block.variant === "wide")));
  assert.doesNotMatch(sourceDocument, /overview\.png|process-interface\.png|result-interface\.png/);
});

test("ProjectCanvas keeps the code shell in CSS and mounts structured image exports", async () => {
  const component = await source("src/components/project-canvas.tsx");
  const project = await source("content/projects/corvo.json");
  const css = await source("src/components/project-canvas.module.css");

  assert.match(component, /presentation === "quotes"/);
  assert.match(component, /presentation === "process"/);
  assert.match(component, /presentation === "controls"/);
  assert.match(project, /corvo-quotes\.png/);
  assert.match(project, /corvo-process\.png/);
  assert.match(project, /corvo-buttons\.png/);
  assert.match(project, /corvo-inputs\.png/);
  assert.match(component, /unoptimized/);

  assert.match(css, /radial-gradient/);
  assert.match(css, /#e3e6e8/i);
  assert.match(css, /#f5f6f7/i);
  assert.match(css, /background-size:\s*32px 32px/);
  assert.match(css, /\.quotes[\s\S]*height:\s*450px/);
  assert.match(css, /\.process[\s\S]*height:\s*480px/);
  assert.match(css, /\.controls[\s\S]*height:\s*268px/);
  assert.match(css, /grid-template-columns:\s*448px 1px 551px/);
});

test("ProjectCanvas raster exports have at least two intrinsic pixels per CSS pixel", async () => {
  const assets = [
    ["public/assets/projects/corvo/canvas/corvo-quotes.png", 852, 366],
    ["public/assets/projects/corvo/canvas/corvo-process.png", 906, 390],
    ["public/assets/projects/corvo/canvas/corvo-buttons.png", 428, 228],
    ["public/assets/projects/corvo/canvas/corvo-inputs.png", 531, 228],
  ];

  for (const [path, cssWidth, cssHeight] of assets) {
    assert.deepEqual(await pngSize(path), { width: cssWidth * 2, height: cssHeight * 2 });
  }
});

test("the project page renders structured image blocks through ProjectCanvas", async () => {
  const page = await source("src/app/projects/[slug]/page.tsx");

  assert.match(page, /import \{ ProjectCanvas \}/);
  assert.match(page, /<ProjectCanvas presentation=\{block\.presentation\} images=\{block\.images\}/);
});

test("all five information sections encode the current Figma vertical rhythm without margin collapse", async () => {
  const css = await source("src/app/projects/[slug]/page.module.css");

  assert.match(css, /\.contentSection\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;/);
  assert.match(css, /\.contentSection:first-child h2\s*\{\s*padding-top:\s*32px;/);
  assert.match(css, /\.contentSection:not\(:first-child\) h2\s*\{\s*padding-top:\s*40px;/);
  assert.match(css, /\.contentSection:first-child\s*>?\s*p \+ p\s*\{\s*margin-top:\s*24px;/);
  assert.match(css, /\.contentSection:nth-child\(2\)\s*>?\s*p \+ p\s*\{\s*margin-top:\s*0;/);
  assert.match(css, /\.contentSection:nth-child\(3\)\s*>?\s*p \+ p\s*\{\s*margin-top:\s*24px;/);
  assert.match(css, /\.contentSection:nth-child\(4\)\s*>?\s*p:nth-of-type\(2\)\s*\{\s*margin-top:\s*0;/);
  assert.match(css, /\.contentSection:nth-child\(4\)\s*>?\s*p:nth-of-type\(3\)\s*\{\s*margin-top:\s*24px;/);
  assert.match(css, /\.contentSection:last-child\s*>?\s*p \+ p\s*\{\s*margin-top:\s*0;/);
  assert.match(css, /\.contentSection:last-child\s*\{\s*padding-bottom:\s*40px;/);
  assert.match(css, /\.projectNotice \+ \.contentDivider\s*\{\s*margin-top:\s*40px;/);
  assert.match(css, /\.contentSection > figure\s*\{\s*margin-top:\s*40px;/);
  assert.match(css, /\.contentSection > figure \+ \.contentDivider\s*\{\s*display:\s*none;/);
  assert.match(css, /\.contentSection ul,[\s\S]*display:\s*flex;[\s\S]*gap:\s*4px;/);
  assert.match(css, /\.contentSection li \+ li\s*\{\s*margin-top:\s*0;/);
  assert.match(css, /\.contentSection ul > li\s*\{\s*height:\s*24px;/);
  assert.doesNotMatch(css, /margin-collapse/);
});
