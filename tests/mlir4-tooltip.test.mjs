import assert from "node:assert/strict";
import test from "node:test";
import { getTooltipPlacement, isSameTooltipPlacement, reduceTooltipPhase } from "../src/lib/tooltip.ts";

test("Tooltip lifecycle preserves the exit phase until animation completion", () => {
  assert.equal(reduceTooltipPhase("closed", "open"), "entering");
  assert.equal(reduceTooltipPhase("entering", "entered"), "open");
  assert.equal(reduceTooltipPhase("open", "close"), "exiting");
  assert.equal(reduceTooltipPhase("exiting", "open"), "entering");
  assert.equal(reduceTooltipPhase("exiting", "exited"), "closed");
});

test("identical Tooltip measurements do not restart the entering frame", () => {
  const placement = { left: 120, top: 80, side: "bottom" };
  assert.equal(isSameTooltipPlacement(placement, { ...placement }), true);
  assert.equal(isSameTooltipPlacement(placement, { ...placement, top: 81 }), false);
  assert.equal(isSameTooltipPlacement(null, placement), false);
});

const trigger = { top: 100, right: 220, bottom: 140, left: 100 };

test("Tooltip aligns to the trigger left edge by default", () => {
  assert.deepEqual(getTooltipPlacement(trigger, { width: 240, height: 56 }, { width: 800, height: 600 }), {
    left: 100,
    top: 152,
    side: "bottom",
  });
});

test("Tooltip shifts left at the right viewport edge", () => {
  assert.equal(getTooltipPlacement({ ...trigger, left: 700, right: 760 }, { width: 240, height: 56 }, { width: 800, height: 600 }).left, 548);
});

test("Tooltip flips above the trigger on vertical collision", () => {
  assert.deepEqual(getTooltipPlacement({ top: 540, right: 220, bottom: 580, left: 100 }, { width: 240, height: 56 }, { width: 800, height: 600 }), {
    left: 100,
    top: 472,
    side: "top",
  });
});
