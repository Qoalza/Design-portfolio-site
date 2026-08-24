import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const strokeAssets = [
  "homepage/telegram.svg",
  "homepage/arrow-right.svg",
  "homepage/chevron-down.svg",
  "homepage/download.svg",
  "homepage/project-bullet.svg",
  "homepage/project-info.svg",
  "homepage/project-refresh.svg",
  "homepage/project-share.svg",
  "projects/chevron-left.svg",
  "projects/chevron-right.svg",
  "projects/corvo/back.svg",
  "projects/corvo/desktop.svg",
  "projects/corvo/tablet.svg",
  "projects/corvo/mobile.svg",
  "projects/corvo/external-link.svg",
  "projects/corvo/info-circle.svg",
  "projects/external-link.svg",
  "projects/info.svg",
];

function readAsset(relativePath) {
  return readFileSync(new URL(`../public/assets/${relativePath}`, import.meta.url), "utf8");
}

test("mapped Line consumers retain full SVG frames and real stroke geometry", () => {
  for (const asset of strokeAssets) {
    const svg = readAsset(asset);
    assert.match(svg, /^<svg\b/);
    assert.match(svg, /viewBox="[^"]+"/);
    assert.match(svg, /\bstroke="(?!none)[^"]+"/);
    assert.doesNotMatch(svg, /<path\b[^>]*\bfill="(?!none)[^"]+"/);
  }
});

test("mapped Duotone consumers retain a stroke and only source-defined translucent fill", () => {
  const svg = readAsset("homepage/home.svg");
  assert.match(svg, /viewBox="0 0 16 16"/);
  assert.match(svg, /\bstroke="(?!none)[^"]+"/);
  assert.match(svg, /fill-opacity="0\.2"/);
});

test("Telegram CTA uses the complete 24px Light stroke source", () => {
  const svg = readAsset("homepage/telegram.svg");
  assert.match(svg, /width="24" height="24" viewBox="0 0 24 24"/);
  assert.match(svg, /stroke="currentColor"/);
  assert.match(svg, /stroke-linejoin="round"/);
});

test("device consumers keep the complete 24px source frames", () => {
  for (const asset of ["projects/corvo/desktop.svg", "projects/corvo/tablet.svg", "projects/corvo/mobile.svg"]) {
    assert.match(readAsset(asset), /width="24" height="24" viewBox="0 0 24 24"/);
  }
});
