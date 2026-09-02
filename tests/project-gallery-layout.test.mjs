import assert from "node:assert/strict";
import test from "node:test";
import { galleryPresentation } from "../src/lib/project-gallery-layout.ts";

test("gallery preserves device width and derives its height from the first image proportion", () => {
  assert.deepEqual(galleryPresentation("desktop", { width: 2960, height: 2048 }), { width: 740, height: 512 });
  assert.deepEqual(galleryPresentation("desktop", { width: 1480, height: 1280 }), { width: 740, height: 640 });
  assert.deepEqual(galleryPresentation("tablet", { width: 800, height: 1132 }), { width: 400, height: 566 });
  assert.deepEqual(galleryPresentation("mobile", { width: 360, height: 640 }), { width: 180, height: 320 });
});
