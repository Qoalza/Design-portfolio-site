import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const lightbox = readFileSync(new URL("../src/components/project-media-lightbox.tsx", import.meta.url), "utf8");
const projectPage = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");

test("Gallery lightbox mounts a modal dialog in the document top layer", () => {
  assert.match(lightbox, /createPortal/);
  assert.match(lightbox, /<dialog/);
  assert.match(lightbox, /showModal\(\)/);
  assert.match(lightbox, /document\.body/);
});

test("Gallery lightbox supports explicit, Escape and backdrop dismissal", () => {
  assert.match(lightbox, /event\.key === "Escape"/);
  assert.match(lightbox, /event\.target === event\.currentTarget/);
  assert.match(lightbox, />Закрыть<\/button>/);
  assert.match(lightbox, /trigger\?\.focus/);
});

test("upper project preview is a non-interactive image", () => {
  const heroBlock = projectPage.slice(
    projectPage.indexOf("className={styles.heroPreview}"),
    projectPage.indexOf("data-project-information-start"),
  );
  assert.match(heroBlock, /<Image/);
  assert.doesNotMatch(heroBlock, /ProjectMediaLightbox|<button|href=/);
});
