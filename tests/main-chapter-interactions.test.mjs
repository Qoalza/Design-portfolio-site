import assert from "node:assert/strict";
import test from "node:test";
import {
  getActionBarVariant,
  getGalleryTarget,
  getProcessWheelDecision,
  getProcessStepTarget,
} from "../src/lib/main-chapter-interactions.ts";

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

test("action bar switches at the beginning of project information in both directions", () => {
  assert.equal(getActionBarVariant(1), "full");
  assert.equal(getActionBarVariant(0), "adaptive");
  assert.equal(getActionBarVariant(-1), "adaptive");
  assert.equal(getActionBarVariant(120), "full");
});
