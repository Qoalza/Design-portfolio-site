import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getCanonicalProjectUrl } from "../src/lib/project-share.ts";

const action = fs.readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
const actionCss = fs.readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");
const share = fs.readFileSync(new URL("../src/components/project-share-button.tsx", import.meta.url), "utf8");
const tooltip = fs.readFileSync(new URL("../src/components/tooltip.tsx", import.meta.url), "utf8");
const tooltipCss = fs.readFileSync(new URL("../src/components/tooltip.module.css", import.meta.url), "utf8");

test("canonical project payload removes query and hash by construction", () => {
  assert.equal(getCanonicalProjectUrl({ origin: "http://localhost:3000", pathname: "/projects/corvo" }), "http://localhost:3000/projects/corvo");
  assert.match(share, /navigator\.clipboard\.writeText\(payload\)/);
  assert.doesNotMatch(share, /location\.href|location\.search|location\.hash|navigator\.share|execCommand/);
});

test("copy feedback is success-only and repeatable without remounting the trigger", () => {
  assert.match(share, /setFeedbackOpen\(copied\)/);
  assert.match(share, /if \(!copied\) return/);
  assert.match(share, /setFeedbackRevision/);
  assert.match(action, /restartKey=\{feedbackRevision\}/);
  assert.match(tooltip, /setPhase\("entering"\)/);
});

test("action Update info and Tooltip icon semantics match their component contracts", () => {
  assert.match(actionCss, /\.updatedAt\s*\{[^}]*height:\s*40px;[^}]*padding:\s*0 16px;[^}]*font-family:\s*var\(--type-tech-font-family\)[^}]*font-feature-settings:\s*var\(--type-tech-m-features\)/s);
  assert.match(tooltipCss, /\.icon\s*\{[^}]*background:\s*#e2e2ec/s);
  assert.match(tooltipCss, /data-icon-tone="accent"[^}]*background:\s*#5db7fd/);
});
