import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { calculateLightboxFrame, calculateLightboxScale } from "../src/lib/project-lightbox.ts";

const project = JSON.parse(fs.readFileSync(new URL("../content/projects/corvo.json", import.meta.url), "utf8"));
const gallery = fs.readFileSync(new URL("../src/components/project-gallery.tsx", import.meta.url), "utf8");
const lightbox = fs.readFileSync(new URL("../src/components/project-media-lightbox.tsx", import.meta.url), "utf8");
const cross = fs.readFileSync(new URL("../public/assets/projects/corvo/cross.svg", import.meta.url), "utf8");

test("lightbox scale is clamped by viewport, DPR quality and the 1.5x cap", () => {
  assert.equal(calculateLightboxScale({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 1600, intrinsicHeight: 2266, dpr: 2, availableWidth: 1200, availableHeight: 1200 }), 1.5);
  assert.equal(calculateLightboxScale({ baseWidth: 740, baseHeight: 512, intrinsicWidth: 1480, intrinsicHeight: 1024, dpr: 2, availableWidth: 2000, availableHeight: 2000 }), 1);
  assert.equal(calculateLightboxScale({ baseWidth: 180, baseHeight: 320, intrinsicWidth: 1080, intrinsicHeight: 1920, dpr: 2, availableWidth: 216, availableHeight: 384 }), 1.2);
  assert.equal(calculateLightboxScale({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 1600, intrinsicHeight: 2266, dpr: 2, availableWidth: 300, availableHeight: 900 }), 0.75);
});

test("lightbox scales Figma layer frames with their own device image", () => {
  assert.deepEqual(
    calculateLightboxFrame({ radius: 12, strokeWidth: 1 }, 1.5),
    { radius: 18, strokeWidth: 1.5 },
  );
  assert.deepEqual(
    calculateLightboxFrame({ radius: 12, strokeWidth: 0.5 }, 1.25),
    { radius: 15, strokeWidth: 0.625 },
  );
  assert.deepEqual(
    calculateLightboxFrame({ radius: 0, strokeWidth: 0 }, 1.5),
    { radius: 0, strokeWidth: 0 },
  );
});

test("all Gallery items carry an explicit live-frame contract", () => {
  const groups = project.content.find((block) => block.type === "gallery").groups;
  const items = groups.flatMap((group) => group.items);
  assert.equal(items.filter((item) => item.frame).length, 15);
  assert.equal(items.filter((item) => item.sourceNodeId?.startsWith("680:")).length, 15);
  assert.deepEqual(groups.map(({ baseWidth, baseHeight }) => [baseWidth, baseHeight]), [[740, 512], [400, 566], [180, 320]]);
  assert.match(gallery, /baseWidth=\{group\.baseWidth\}/);
  assert.match(gallery, /frame=\{item\.frame\}/);
  assert.match(gallery, /sourceNodeId=\{item\.sourceNodeId\}/);
});

test("modal measures its real media area and keeps the frame as a single layer", () => {
  assert.match(lightbox, /ResizeObserver/);
  assert.match(lightbox, /window\.devicePixelRatio/);
  assert.match(lightbox, /calculateLightboxScale/);
  assert.match(lightbox, /calculateLightboxFrame/);
  assert.match(lightbox, /data-figma-node-id=\{sourceNodeId\}/);
  assert.match(lightbox, /currentSrc/);
  assert.match(lightbox, /naturalWidth/);
  assert.match(lightbox, /styles\.expandedFrame/);
  assert.match(lightbox, /event\.target === event\.currentTarget/);
  assert.match(lightbox, /<SquareButton/);
  assert.match(cross, /width="24" height="24" viewBox="0 0 24 24"/);
  assert.match(cross, /stroke="currentColor" stroke-width="1\.3"/);
  assert.doesNotMatch(cross, /preserveAspectRatio="none"/);
});
