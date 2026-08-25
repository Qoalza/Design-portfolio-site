import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ScrollFrameCoordinator } from "../src/lib/scroll-frame-coordinator.ts";

test("one frame coordinator orders root, Gallery and invalidated geometry without duplicate RAF", () => {
  const frames = [];
  const cancelled = [];
  const coordinator = new ScrollFrameCoordinator(
    (callback) => { frames.push(callback); return frames.length; },
    (id) => { cancelled.push(id); },
  );
  const calls = [];

  const unregisterRoot = coordinator.register({ id: "root", priority: 10, continuous: true, update: () => { calls.push("root"); } });
  const unregisterGallery = coordinator.register({ id: "gallery", priority: 20, continuous: true, update: () => { calls.push("gallery"); } });
  const unregisterGeometry = coordinator.register({ id: "geometry", priority: 30, update: () => { calls.push("geometry"); } });
  coordinator.invalidate("geometry");

  assert.equal(frames.length, 1);
  frames.shift()(16);
  assert.deepEqual(calls, ["root", "gallery", "geometry"]);
  assert.equal(frames.length, 1);

  unregisterGeometry();
  unregisterGallery();
  unregisterRoot();
  assert.equal(cancelled.length, 1);
});

test("duplicate subscriber ids are rejected instead of creating a second loop", () => {
  const coordinator = new ScrollFrameCoordinator(() => 1, () => undefined);
  const unregister = coordinator.register({ id: "root", priority: 10, continuous: true, update: () => undefined });
  assert.throws(() => coordinator.register({ id: "root", priority: 10, update: () => undefined }), /already registered/);
  unregister();
});

test("the root Lenis adapter uses the approved profile and shared manual RAF", () => {
  const provider = readFileSync(new URL("../src/components/smooth-scroll-provider.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

  assert.match(provider, /from "lenis\/react"/);
  assert.match(provider, /autoRaf:\s*false/);
  assert.match(provider, /smoothWheel:\s*true/);
  assert.match(provider, /syncTouch:\s*false/);
  assert.match(provider, /lerp:\s*0\.1/);
  assert.match(provider, /wheelMultiplier:\s*1/);
  assert.match(provider, /stopInertiaOnNavigate:\s*true/);
  assert.match(provider, /min-width:\s*1280px/);
  assert.match(provider, /pointer:\s*fine/);
  assert.match(provider, /prefers-reduced-motion:\s*reduce/);
  assert.match(layout, /<SmoothScrollProvider>/);
});

test("Gallery and project geometry use the shared frame and scroll contracts", () => {
  const gallery = readFileSync(new URL("../src/components/project-gallery.tsx", import.meta.url), "utf8");
  const actionBar = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const navigation = readFileSync(new URL("../src/components/project-section-navigation.tsx", import.meta.url), "utf8");

  assert.match(gallery, /new Lenis/);
  assert.match(gallery, /orientation:\s*"horizontal"/);
  assert.match(gallery, /registerScrollFrameSubscriber/);
  assert.match(actionBar, /registerScrollFrameSubscriber/);
  assert.doesNotMatch(actionBar, /requestAnimationFrame/);
  assert.match(navigation, /registerScrollFrameSubscriber/);
  assert.match(navigation, /getPrimaryScrollController/);
  assert.doesNotMatch(navigation, /requestAnimationFrame/);
});
