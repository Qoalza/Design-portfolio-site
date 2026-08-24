import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getActiveProjectSectionIndex,
  getGalleryTarget,
  getProcessStepTarget,
} from "../src/lib/main-chapter-interactions.ts";

test("project navigation follows the last section that crossed the sticky activation line", () => {
  assert.equal(getActiveProjectSectionIndex([220, 760, 1280], 156), 0);
  assert.equal(getActiveProjectSectionIndex([120, 660, 1180], 156), 0);
  assert.equal(getActiveProjectSectionIndex([-420, 120, 640], 156), 1);
  assert.equal(getActiveProjectSectionIndex([-980, -440, 120], 156), 2);
});

test("project navigation has a stable fallback for empty and invalid section lists", () => {
  assert.equal(getActiveProjectSectionIndex([], 156), 0);
  assert.equal(getActiveProjectSectionIndex([Number.NaN, 220], 156), 0);
});

test("project navigation measures the shared header stack instead of a fixed activation constant", () => {
  const source = readFileSync(new URL("../src/components/project-section-navigation.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /sectionActivationTop\s*=\s*\d/);
  assert.match(source, /data-site-header-fixed/);
  assert.match(source, /ResizeObserver/);
});

test("process stepper advances exactly one step from an arrow action", () => {
  assert.deepEqual(getProcessStepTarget(0, 1, 3), { consumed: true, index: 1 });
  assert.deepEqual(getProcessStepTarget(1, 1, 3), { consumed: true, index: 2 });
});

test("process stepper releases page scrolling past either edge", () => {
  assert.deepEqual(getProcessStepTarget(0, -1, 3), { consumed: false, index: 0 });
  assert.deepEqual(getProcessStepTarget(2, 1, 3), { consumed: false, index: 2 });
});

test("process stepper supports the reverse direction without skipping", () => {
  assert.deepEqual(getProcessStepTarget(2, -1, 3), { consumed: true, index: 1 });
});

test("process stepper never captures wheel or trackpad scrolling", () => {
  const source = readFileSync(new URL("../src/components/process-stepper.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /addEventListener\(["']wheel["']/);
  assert.doesNotMatch(source, /preventDefault\(\)/);
});

test("gallery navigation is non-looping and hides unavailable directions", () => {
  assert.deepEqual(getGalleryTarget(0, -1, 3), { available: false, index: 0 });
  assert.deepEqual(getGalleryTarget(0, 1, 3), { available: true, index: 1 });
  assert.deepEqual(getGalleryTarget(2, 1, 3), { available: false, index: 2 });
});

test("single-image gallery exposes no navigation", () => {
  assert.deepEqual(getGalleryTarget(0, 1, 1), { available: false, index: 0 });
  assert.deepEqual(getGalleryTarget(0, -1, 1), { available: false, index: 0 });
});

test("action bar anchors to the rendered project columns without viewport-center formulas", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /data-project-content-column/);
  assert.match(component, /ResizeObserver/);
  assert.match(component, /left: variant === "adaptive"/);
  assert.match(component, /width: variant === "adaptive"/);
  assert.doesNotMatch(styles, /calc\(50%|calc\(50vw/);
});
