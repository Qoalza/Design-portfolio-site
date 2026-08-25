import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { GalleryInputArbiter } from "../src/lib/gallery-input-arbiter.ts";

const gallerySource = fs.readFileSync(new URL("../src/components/project-gallery.tsx", import.meta.url), "utf8");
const providerSource = fs.readFileSync(new URL("../src/components/smooth-scroll-provider.tsx", import.meta.url), "utf8");
const lenisPackage = JSON.parse(fs.readFileSync(new URL("../node_modules/lenis/package.json", import.meta.url), "utf8"));

function wheel(deltaX, deltaY, timeStamp) {
  return { deltaX, deltaY, deltaMode: 0, timeStamp };
}

test("buffers undecided vertical input and releases it to root exactly once", () => {
  const arbiter = new GalleryInputArbiter();
  const first = wheel(3, 7, 0);
  const second = wheel(2, 11, 16);

  assert.deepEqual(arbiter.classify(first, "gallery"), {
    ownership: "undecided", blockRoot: true, galleryStep: null, rootDeltaY: null, stoppedRoot: false,
  });
  assert.deepEqual(arbiter.classify(first, "gallery"), {
    ownership: "undecided", blockRoot: true, galleryStep: null, rootDeltaY: null, stoppedRoot: false,
  });
  assert.deepEqual(arbiter.classify(second, "gallery"), {
    ownership: "vertical", blockRoot: false, galleryStep: null, rootDeltaY: 18, stoppedRoot: false,
  });
  assert.equal(arbiter.takeRootDelta(second), 18);
  assert.equal(arbiter.takeRootDelta(second), null);

  const third = wheel(1, 9, 32);
  assert.equal(arbiter.classify(third, "gallery").rootDeltaY, 9);
  assert.equal(arbiter.takeRootDelta(third), 9);
});

test("locks a horizontal series before root mutation and emits one step", () => {
  let stopCount = 0;
  const arbiter = new GalleryInputArbiter({ stopRootAtActual: () => { stopCount += 1; } });
  const first = wheel(10, 6, 0);
  const second = wheel(10, 7, 16);
  const third = wheel(4, 30, 32);

  assert.equal(arbiter.classify(first, "gallery").ownership, "undecided");
  assert.deepEqual(arbiter.classify(second, "gallery"), {
    ownership: "horizontal", blockRoot: true, galleryStep: 1, rootDeltaY: null, stoppedRoot: true,
  });
  assert.equal(stopCount, 1);
  assert.deepEqual(arbiter.classify(third, "gallery"), {
    ownership: "horizontal", blockRoot: true, galleryStep: null, rootDeltaY: null, stoppedRoot: false,
  });
  assert.equal(stopCount, 1);
});

test("releases ownership after inactivity and lets the next vertical series through", () => {
  const arbiter = new GalleryInputArbiter({ idleMs: 160 });
  arbiter.classify(wheel(20, 2, 0), "gallery");
  const vertical = wheel(0, 120, 200);

  const result = arbiter.classify(vertical, "gallery");
  assert.equal(result.ownership, "vertical");
  assert.equal(result.blockRoot, false);
  assert.equal(arbiter.takeRootDelta(vertical), 120);
});

test("changing gallery ownership resets the previous series", () => {
  const arbiter = new GalleryInputArbiter();
  arbiter.classify(wheel(20, 1, 0), "desktop");
  const event = wheel(0, 120, 16);
  const result = arbiter.classify(event, "tablet");
  assert.equal(result.ownership, "vertical");
  assert.equal(arbiter.takeRootDelta(event), 120);
});

test("Gallery and Lenis share one pre-mutation arbiter contract", () => {
  assert.equal(lenisPackage.version, "1.3.25");
  assert.match(gallerySource, /galleryInputArbiter\.classify\(event\.nativeEvent, group\.id\)/);
  assert.match(providerSource, /virtualScroll:\s*\(data\)\s*=>/);
  assert.match(providerSource, /galleryInputArbiter\.classify\(data\.event, owner\)/);
  assert.match(providerSource, /if \(decision\.blockRoot\) return false/);
  assert.match(providerSource, /data\.deltaY = rootDeltaY/);
  assert.match(providerSource, /wheelMultiplier:\s*1/);
});
