import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("Corvo gallery defines three independent groups with five current assets each", async () => {
  const page = await source("src/app/projects/[slug]/page.tsx");

  for (const device of ["desktop", "tablet", "mobile"]) {
    for (let index = 1; index <= 5; index += 1) {
      assert.match(page, new RegExp(`${device}-0${index}\\.png`));
    }
  }

  assert.match(page, /id:\s*"desktop"/);
  assert.match(page, /id:\s*"tablet"/);
  assert.match(page, /id:\s*"mobile"/);
});

test("ProjectGallery keeps independent indexes and always renders disabled-capable arrows", async () => {
  const component = await source("src/components/project-gallery.tsx");

  assert.match(component, /function GalleryGroup/);
  assert.match(component, /useState\(0\)/);
  assert.match(component, /data-gallery-group=/);
  assert.match(component, /disabled=\{!previous\.available\}/);
  assert.match(component, /disabled=\{!next\.available\}/);
  assert.doesNotMatch(component, /itemCount > 1 \?/);
});

test("Gallery accepts only dominant horizontal intent and resolves every gesture to one step", async () => {
  const component = await source("src/components/project-gallery.tsx");

  assert.match(component, /Math\.abs\(event\.deltaX\) > Math\.abs\(event\.deltaY\)/);
  assert.match(component, /event\.preventDefault\(\)/);
  assert.match(component, /setPointerCapture/);
  assert.match(component, /move\(deltaX > 0 \? -1 : 1\)/);
  assert.doesNotMatch(component, /overflowX:\s*["']auto/);
});

test("Gallery geometry matches the current Desktop, Tablet and Mobile instances", async () => {
  const css = await source("src/components/project-gallery.module.css");

  assert.match(css, /--gallery-item-width:\s*740px/);
  assert.match(css, /--gallery-item-height:\s*512px/);
  assert.match(css, /--gallery-item-width:\s*400px/);
  assert.match(css, /--gallery-item-height:\s*566px/);
  assert.match(css, /--gallery-item-width:\s*180px/);
  assert.match(css, /--gallery-item-height:\s*320px/);
  assert.match(css, /--gallery-gap:\s*24px/);
  assert.match(css, /width:\s*1176px/);
});

test("the Gallery is outside the information article and exposes a geometry anchor", async () => {
  const page = await source("src/app/projects/[slug]/page.tsx");
  const component = await source("src/components/project-gallery.tsx");
  const informationEnd = page.indexOf("</div>\n\n          {project.slug === \"corvo\"");

  assert.notEqual(informationEnd, -1);
  assert.match(component, /data-project-gallery/);
});
