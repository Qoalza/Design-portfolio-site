import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { calculateLightboxScale } from "../src/lib/project-lightbox.ts";

const page = fs.readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
const gallery = fs.readFileSync(new URL("../src/components/project-gallery.tsx", import.meta.url), "utf8");
const lightbox = fs.readFileSync(new URL("../src/components/project-media-lightbox.tsx", import.meta.url), "utf8");
const cross = fs.readFileSync(new URL("../public/assets/projects/corvo/cross.svg", import.meta.url), "utf8");

test("lightbox scale is clamped by viewport, DPR quality and the 1.5x cap", () => {
  assert.equal(calculateLightboxScale({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 1600, intrinsicHeight: 2266, dpr: 2, availableWidth: 1200, availableHeight: 1200 }), 1.5);
  assert.equal(calculateLightboxScale({ baseWidth: 740, baseHeight: 512, intrinsicWidth: 1480, intrinsicHeight: 1024, dpr: 2, availableWidth: 2000, availableHeight: 2000 }), 1);
  assert.equal(calculateLightboxScale({ baseWidth: 180, baseHeight: 320, intrinsicWidth: 1080, intrinsicHeight: 1920, dpr: 2, availableWidth: 216, availableHeight: 384 }), 1.2);
  assert.equal(calculateLightboxScale({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 1600, intrinsicHeight: 2266, dpr: 2, availableWidth: 300, availableHeight: 900 }), 0.75);
});

test("all Gallery items carry an explicit live-frame contract", () => {
  assert.equal((page.match(/frame:\s*\{/g) ?? []).length, 15);
  assert.match(page, /baseWidth:\s*740,\s*baseHeight:\s*512/);
  assert.match(page, /baseWidth:\s*400,\s*baseHeight:\s*566/);
  assert.match(page, /baseWidth:\s*180,\s*baseHeight:\s*320/);
  assert.match(gallery, /baseWidth=\{group\.baseWidth\}/);
  assert.match(gallery, /frame=\{item\.frame\}/);
});

test("modal measures its real media area and keeps the frame as a single layer", () => {
  assert.match(lightbox, /ResizeObserver/);
  assert.match(lightbox, /window\.devicePixelRatio/);
  assert.match(lightbox, /calculateLightboxScale/);
  assert.match(lightbox, /currentSrc/);
  assert.match(lightbox, /naturalWidth/);
  assert.match(lightbox, /styles\.expandedFrame/);
  assert.match(lightbox, /event\.target === event\.currentTarget/);
  assert.match(lightbox, /<SquareButton/);
  assert.match(cross, /width="24" height="24" viewBox="0 0 24 24"/);
  assert.match(cross, /stroke="currentColor" stroke-width="1\.3"/);
  assert.doesNotMatch(cross, /preserveAspectRatio="none"/);
});
