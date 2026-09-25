import assert from 'node:assert/strict';
import test from 'node:test';
import {ADAPTIVE_PRESETS, getIframeViewportHeight, RESPONSIVE_HERO_SCALE} from '../src/project-hero/width.mjs';

test('integer iframe viewport covers every fractional animated height', () => {
  // Regression: 573.375 physical px yielded a 955px document viewport,
  // leaving 0.375 physical px outside its rendered surface.
  assert.equal(getIframeViewportHeight(573.375), 956);
  for (let step = 0; step <= 10000; step++) {
    const height = 384 + (660 - 384) * step / 10000;
    const viewport = getIframeViewportHeight(height);
    assert.ok(Number.isInteger(viewport));
    const excess = viewport * RESPONSIVE_HERO_SCALE - height;
    assert.ok(excess >= -1e-9 && excess < RESPONSIVE_HERO_SCALE + 1e-9);
  }
});

test('viewport overscan preserves all settled preset heights', () => {
  for (const preset of Object.values(ADAPTIVE_PRESETS)) {
    assert.equal(getIframeViewportHeight(preset.productHeight) * RESPONSIVE_HERO_SCALE, preset.productHeight);
  }
});
