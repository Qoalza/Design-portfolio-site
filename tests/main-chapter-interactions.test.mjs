import assert from "node:assert/strict";
import test from "node:test";
import {
  getActionBarVariant,
  getActiveProjectSectionIndex,
  getGalleryTarget,
  isProcessViewportActive,
  getProcessWheelDecision,
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

test("process stepper activates from section visibility rather than pointer position", () => {
  assert.equal(isProcessViewportActive(248, 856, 900), true);
  assert.equal(isProcessViewportActive(500, 1108, 900), false);
  assert.equal(isProcessViewportActive(-76, 532, 900), true);
  assert.equal(isProcessViewportActive(-220, 388, 900), false);
});

test("process viewport activation handles compact viewports and invalid geometry", () => {
  assert.equal(isProcessViewportActive(120, 728, 720), true);
  assert.equal(isProcessViewportActive(720, 720, 720), false);
  assert.equal(isProcessViewportActive(0, 608, 0), false);
});

test("process stepper consumes one forward gesture and advances exactly one step", () => {
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

test("process stepper keeps residual deltas of a captured gesture away from page scroll", () => {
  assert.deepEqual(getProcessWheelDecision(2, 1, 3, true), {
    consumed: true,
    index: 2,
    shouldAdvance: false,
  });
  assert.deepEqual(getProcessWheelDecision(2, 1, 3, false), {
    consumed: false,
    index: 2,
    shouldAdvance: false,
  });
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

test("action bar switches when project information reaches the measured header edge", () => {
  assert.equal(getActionBarVariant(161, 160), "full");
  assert.equal(getActionBarVariant(160, 160), "adaptive");
  assert.equal(getActionBarVariant(159, 160), "adaptive");
  assert.equal(getActionBarVariant(145, 80), "full");
});
