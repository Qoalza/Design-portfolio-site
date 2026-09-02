import assert from "node:assert/strict";
import test from "node:test";

import { PreviewWindowController } from "../tools/des-art-admin/src/preview-window.mjs";

function popup() {
  let closed = false;
  let focused = 0;
  let closeCalls = 0;
  return {
    get closed() { return closed; },
    get document() { throw new Error("cross-origin DOM must not be read"); },
    focus() { focused += 1; },
    close() { closeCalls += 1; closed = true; },
    state: () => ({ focused, closeCalls }),
  };
}

test("preview opens a named placeholder once and reuses the cross-origin window", () => {
  const target = popup();
  const calls = [];
  const controller = new PreviewWindowController({
    open: (url, name) => { calls.push({ url, name }); return target; },
  });

  const first = controller.begin();
  assert.equal(first.blocked, false);
  assert.equal(first.created, true);
  assert.deepEqual(calls, [{ url: "about:blank", name: "des-art-preview" }]);
  assert.equal(controller.navigate(first, "http://127.0.0.1:41732/projects/one"), "navigated");

  const second = controller.begin();
  assert.equal(second.created, false);
  assert.equal(controller.navigate(second, "http://127.0.0.1:41732/projects/two"), "navigated");
  assert.deepEqual(calls, [
    { url: "about:blank", name: "des-art-preview" },
    { url: "http://127.0.0.1:41732/projects/one", name: "des-art-preview" },
    { url: "http://127.0.0.1:41732/projects/two", name: "des-art-preview" },
  ]);
  assert.equal(target.state().focused, 3);
});

test("preview preserves a reused window after failure and closes only its new placeholder", () => {
  const target = popup();
  const controller = new PreviewWindowController({ open: () => target });
  const first = controller.begin();
  controller.fail(first);
  assert.equal(target.state().closeCalls, 1);

  const reused = popup();
  const existing = new PreviewWindowController({ open: () => reused });
  existing.begin();
  const retry = existing.begin();
  existing.fail(retry);
  assert.equal(reused.state().closeCalls, 0);
});

test("preview ignores a stale completion and reports closed or blocked targets", () => {
  const target = popup();
  const calls = [];
  const controller = new PreviewWindowController({
    open: (url, name) => { calls.push({ url, name }); return target; },
  });
  const first = controller.begin();
  const second = controller.begin();
  assert.equal(controller.navigate(first, "http://127.0.0.1:41732/projects/old"), "stale");
  assert.equal(controller.navigate(second, "http://127.0.0.1:41732/projects/new"), "navigated");
  assert.equal(calls.some((call) => call.url.endsWith("/old")), false);

  target.close();
  assert.equal(controller.navigate(second, "http://127.0.0.1:41732/projects/closed"), "closed");

  const blocked = new PreviewWindowController({ open: () => null }).begin();
  assert.equal(blocked.blocked, true);
});
