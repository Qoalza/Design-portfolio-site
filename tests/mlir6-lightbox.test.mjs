import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { calculateLightboxMediaSize, calculateLightboxScale } from "../src/lib/project-lightbox.ts";

const project = JSON.parse(fs.readFileSync(new URL("../content/projects/corvo.json", import.meta.url), "utf8"));
const gallery = fs.readFileSync(new URL("../src/components/project-gallery.tsx", import.meta.url), "utf8");
const lightbox = fs.readFileSync(new URL("../src/components/project-media-lightbox.tsx", import.meta.url), "utf8");
const cross = fs.readFileSync(new URL("../public/assets/projects/corvo/cross.svg", import.meta.url), "utf8");

test("lightbox scale is clamped by viewport, DPR quality and the 2x cap", () => {
  assert.equal(calculateLightboxScale({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 1600, intrinsicHeight: 2266, dpr: 2, availableWidth: 1200, availableHeight: 1200 }), 2);
  assert.equal(calculateLightboxScale({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 500, intrinsicHeight: 707.5, dpr: 1, availableWidth: 1200, availableHeight: 1200 }), 1.25);
  assert.equal(calculateLightboxScale({ baseWidth: 740, baseHeight: 512, intrinsicWidth: 1480, intrinsicHeight: 1024, dpr: 2, availableWidth: 2000, availableHeight: 2000 }), 1);
  assert.equal(calculateLightboxScale({ baseWidth: 180, baseHeight: 320, intrinsicWidth: 1080, intrinsicHeight: 1920, dpr: 2, availableWidth: 216, availableHeight: 384 }), 1.2);
  assert.equal(calculateLightboxScale({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 1600, intrinsicHeight: 2266, dpr: 2, availableWidth: 300, availableHeight: 900 }), 0.75);
  assert.equal(calculateLightboxScale({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 4000, intrinsicHeight: 1000, dpr: 1, availableWidth: 4000, availableHeight: 4000 }), 1000 / 566);
});

test("lightbox uses the actual image aspect ratio without adding a frame", () => {
  assert.deepEqual(
    calculateLightboxMediaSize({ baseWidth: 400, baseHeight: 400, intrinsicWidth: 400, intrinsicHeight: 400 }),
    { width: 400, height: 400 },
  );
  assert.deepEqual(
    calculateLightboxMediaSize({ baseWidth: 740, baseHeight: 512, intrinsicWidth: 1480, intrinsicHeight: 1024 }),
    { width: 740, height: 512 },
  );
  assert.deepEqual(
    calculateLightboxMediaSize({ baseWidth: 400, baseHeight: 566, intrinsicWidth: 500, intrinsicHeight: 1000 }),
    { width: 400, height: 800 },
  );
});

test("Gallery data contains only device ids and images while code owns its frame contract", () => {
  const groups = project.content.find((block) => block.type === "gallery").groups;
  const items = groups.flatMap((group) => group.images);
  assert.equal(items.length, 15);
  assert.equal(items.some((item) => "frame" in item || "sourceNodeId" in item), false);
  assert.deepEqual(groups.map(({ deviceId }) => deviceId), ["desktop", "tablet", "mobile"]);
  assert.match(gallery, /const DEVICE_PRESENTATION/);
  assert.match(gallery, /function itemFrame/);
  assert.match(gallery, /galleryPresentation\(group\.deviceId, group\.images\[0\]\)/);
  assert.match(gallery, /baseWidth=\{media\.width\}/);
  assert.match(gallery, /frame=\{itemFrame\(group\.deviceId\)\}/);
});

test("modal measures its real media area and keeps the frame as a single layer", () => {
  assert.match(lightbox, /ResizeObserver/);
  assert.match(lightbox, /window\.devicePixelRatio/);
  assert.match(lightbox, /calculateLightboxScale/);
  assert.match(lightbox, /calculateLightboxMediaSize/);
  assert.doesNotMatch(lightbox, /sourceNodeId|data-figma-node-id/);
  assert.match(lightbox, /currentSrc/);
  assert.match(lightbox, /naturalWidth/);
  assert.match(lightbox, /className=\{styles\.expandedFrame\}/);
  assert.doesNotMatch(lightbox, /styles\.expandedFrame\} \$\{styles\.frame\}/);
  assert.match(lightbox, /event\.target === event\.currentTarget/);
  assert.match(lightbox, /<SquareButton/);
  assert.match(cross, /width="24" height="24" viewBox="0 0 24 24"/);
  assert.match(cross, /stroke="currentColor" stroke-width="1\.3"/);
  assert.doesNotMatch(cross, /preserveAspectRatio="none"/);
});
