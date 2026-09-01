import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const lightbox = readFileSync(new URL("../src/components/project-media-lightbox.tsx", import.meta.url), "utf8");
const projectPage = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
const lightboxMath = readFileSync(new URL("../src/lib/project-lightbox.ts", import.meta.url), "utf8");

test("Gallery lightbox mounts a modal dialog in the document top layer", () => {
  assert.match(lightbox, /createPortal/);
  assert.match(lightbox, /<dialog/);
  assert.match(lightbox, /showModal\(\)/);
  assert.match(lightbox, /document\.body/);
});

test("Gallery lightbox supports explicit, Escape and backdrop dismissal", () => {
  assert.match(lightbox, /event\.key === "Escape"/);
  assert.match(lightbox, /event\.target === event\.currentTarget/);
  assert.match(lightbox, /ariaLabel="Закрыть увеличенное изображение"/);
  assert.match(lightbox, /icon="\/assets\/projects\/corvo\/cross\.svg"/);
  assert.match(lightbox, /trigger\?\.focus/);
  assert.match(lightbox, /scrollPositionRef/);
  assert.match(lightbox, /window\.scrollTo\(scrollPosition\.x, scrollPosition\.y\)/);
  assert.match(lightbox, /className=\{styles\.expandedFrame\}/);
  assert.doesNotMatch(lightbox, /styles\.expandedFrame\} \$\{styles\.frame\}/);
});

test("upper project preview is a non-interactive image", () => {
  const heroBlock = projectPage.slice(
    projectPage.indexOf("function ProjectHeroVisual"),
    projectPage.indexOf("export function generateStaticParams"),
  );
  assert.match(heroBlock, /<Image/);
  assert.doesNotMatch(heroBlock, /ProjectMediaLightbox|<button|href=/);
});

test("contained gallery previews shrink to their media bounds instead of painting a letterbox", () => {
  assert.match(lightbox, /calculateContainedPreviewSize/);
  assert.match(lightbox, /width:\s*`\$\{previewMediaSize\.width\}px`/);
  assert.match(lightbox, /height:\s*`\$\{previewMediaSize\.height\}px`/);
  assert.match(lightboxMath, /Math\.min\(baseWidth\s*\/\s*intrinsicWidth,\s*baseHeight\s*\/\s*intrinsicHeight\)/s);
});
