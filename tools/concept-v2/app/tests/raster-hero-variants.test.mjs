import assert from 'node:assert/strict';
import test from 'node:test';
import {sarafanRasterHero} from '../src/project-hero/raster-definition.mjs';
import {rasterPreviewVariants, rasterVariantDefinition} from '../src/project-hero/raster-variants.mjs';
import {visibleDotIndexes} from '../src/project-hero/raster-carousel.mjs';

test('variant space exposes only odd image counts', () => {
  assert.deepEqual(rasterPreviewVariants.map(variant => [variant.id, variant.count]),
    [['3', 3], ['5', 5], ['5+', 7]]);
});

test('each variant keeps one distinct slide per position and the original home image centered', () => {
  for (const variant of rasterPreviewVariants) {
    const definition = rasterVariantDefinition(sarafanRasterHero, variant.id);
    const slides = definition.contexts[0].slides;
    assert.equal(slides.length, variant.count);
    assert.equal(new Set(slides.map(slide => slide.id)).size, variant.count);
    assert.equal(slides.find(slide => slide.id === definition.contexts[0].initialSlideId)?.src,
      sarafanRasterHero.contexts[0].slides[1].src);
    assert.equal(visibleDotIndexes(0, slides.length).length, Math.min(variant.count, 5));
  }
});

test('the 5+ fixture includes sixth and seventh images while dots stay capped at five', () => {
  const slides = rasterVariantDefinition(sarafanRasterHero, '5+').contexts[0].slides;
  for (const index of [5, 6]) {
    assert.ok(slides[index].id);
    assert.equal(visibleDotIndexes(index, slides.length).length, 5);
  }
});

test('five and 5+ previews show the same raster in their far-left initial slot', () => {
  const five = rasterVariantDefinition(sarafanRasterHero, '5').contexts[0];
  const seven = rasterVariantDefinition(sarafanRasterHero, '5+').contexts[0];
  assert.equal(five.slides.at(-1).src, seven.slides.at(-1).src);
});
