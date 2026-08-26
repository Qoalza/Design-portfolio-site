import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actionBar = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
const share = readFileSync(new URL("../src/components/project-share-button.tsx", import.meta.url), "utf8");

test("MLIR7 uses the exact new copy feedback in both Tooltip and screen-reader announcement", () => {
  assert.match(actionBar, /content=\{\{ text: "Ссылка скопирована", icon: "\/assets\/projects\/check\.svg" \}\}/);
  assert.match(share, /copied \? "Ссылка скопирована" : "Не удалось скопировать ссылку"/);
  assert.doesNotMatch(actionBar, /text: "Скопировано"/);
  assert.doesNotMatch(share, /copied \? "Скопировано"/);
});

test("MLIR7 keeps the accepted repeat, manual Tooltip and canonical copy contracts", () => {
  assert.match(actionBar, /restartKey=\{feedbackRevision\}/);
  assert.match(actionBar, /triggerMode="manual"/);
  assert.match(actionBar, /aria-live="polite"/);
  assert.match(share, /navigator\.clipboard\.writeText\(payload\)/);
  assert.match(share, /setFeedbackRevision/);
  assert.doesNotMatch(share, /navigator\.share|location\.href/);
});
