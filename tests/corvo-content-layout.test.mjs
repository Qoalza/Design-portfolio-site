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
  const mdx = await source("content/projects/corvo.mdx");
  const headings = [...mdx.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());

  assert.deepEqual(headings, ["О проекте", "Задача", "Процесс", "Система", "Результат"]);
});

test("Corvo uses code-built canvases and no stale full-frame project screenshots", async () => {
  const mdx = await source("content/projects/corvo.mdx");

  assert.match(mdx, /<ProjectCanvas variant="quotes"/);
  assert.match(mdx, /<ProjectCanvas variant="process"/);
  assert.match(mdx, /<ProjectCanvas variant="controls"/);
  assert.match(mdx, /<ProjectNotice variant="wide"/);
  assert.doesNotMatch(mdx, /overview\.png|process-interface\.png|result-interface\.png/);
});

test("ProjectCanvas keeps the code shell in CSS and mounts four independent Figma exports", async () => {
  const component = await source("src/components/project-canvas.tsx");
  const css = await source("src/components/project-canvas.module.css");

  assert.match(component, /variant:\s*"quotes"/);
  assert.match(component, /variant:\s*"process"/);
  assert.match(component, /variant:\s*"controls"/);
  assert.match(component, /corvo-quotes\.png/);
  assert.match(component, /corvo-process\.png/);
  assert.match(component, /corvo-buttons\.png/);
  assert.match(component, /corvo-inputs\.png/);
  assert.equal((component.match(/unoptimized/g) ?? []).length, 4);
  assert.doesNotMatch(component, /Array\.from|\.map\(/);

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

test("the project page registers ProjectCanvas for evaluated MDX", async () => {
  const page = await source("src/app/projects/[slug]/page.tsx");

  assert.match(page, /import \{ ProjectCanvas \}/);
  assert.match(page, /ProjectCanvas,/);
});
