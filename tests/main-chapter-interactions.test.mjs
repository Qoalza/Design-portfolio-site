import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getActiveProjectSectionIndex,
  getGalleryLayout,
  getGalleryOffsetTarget,
  getGalleryPointerGesture,
  getGalleryTarget,
  getProcessStepTarget,
  getProjectNavigationRailHeight,
  getTerminalSectionActivationTop,
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

test("project navigation activates the short terminal section before Gallery", () => {
  assert.equal(getActiveProjectSectionIndex([-820, 480], 156, 620), 1);
  assert.equal(getActiveProjectSectionIndex([-820, 680], 156, 620), 0);
});

test("terminal activation is derived from visible section geometry, not its label", () => {
  assert.equal(getTerminalSectionActivationTop(156, 812, 240), 156 + (692 - 156) / 3);
  assert.equal(getTerminalSectionActivationTop(156, 812, 1600), 156);
});

test("navigation rail ends when its last item aligns with the last section anchor", () => {
  assert.equal(getProjectNavigationRailHeight({
    informationTop: 1000,
    terminalSectionTop: 3000,
    lastItemOffset: 160,
    navigationHeight: 220,
  }), 2060);
  assert.equal(getProjectNavigationRailHeight({
    informationTop: Number.NaN,
    terminalSectionTop: 3000,
    lastItemOffset: 160,
    navigationHeight: 220,
  }), 220);
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

test("gallery availability follows measured overflow rather than item count", () => {
  assert.deepEqual(getGalleryLayout([0, 204, 408, 612, 816], [180, 180, 180, 180, 180], 1176), {
    offsets: [0],
    maxOffset: 0,
  });
  assert.deepEqual(getGalleryOffsetTarget(0, 1, [0]), { available: false, index: 0 });
});

test("gallery offsets snap to items and clamp at the measured maximum", () => {
  const layout = getGalleryLayout([0, 764, 1528], [740, 740, 740], 1176);
  assert.deepEqual(layout, { offsets: [0, 764, 1092], maxOffset: 1092 });
  assert.deepEqual(getGalleryOffsetTarget(1, 1, layout.offsets), { available: true, index: 2 });
  assert.deepEqual(getGalleryOffsetTarget(2, 1, layout.offsets), { available: false, index: 2 });
});

test("Gallery pointer gestures preserve clicks until a dominant horizontal drag is confirmed", () => {
  assert.deepEqual(getGalleryPointerGesture(3, 2), { kind: "click", step: null });
  assert.deepEqual(getGalleryPointerGesture(9, 12), { kind: "vertical", step: null });
  assert.deepEqual(getGalleryPointerGesture(9, 2), { kind: "horizontal-drag", step: null });
  assert.deepEqual(getGalleryPointerGesture(-48, 4), { kind: "horizontal-drag", step: 1 });
  assert.deepEqual(getGalleryPointerGesture(48, 4), { kind: "horizontal-drag", step: -1 });
});

test("action bar anchors to the rendered project columns without viewport-center formulas", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /data-project-content-column/);
  assert.match(component, /ResizeObserver/);
  assert.match(component, /--action-adaptive-left/);
  assert.match(component, /--action-adaptive-width/);
  assert.doesNotMatch(styles, /calc\(50%|calc\(50vw/);
});
