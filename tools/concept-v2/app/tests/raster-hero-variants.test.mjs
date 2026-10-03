import assert from 'node:assert/strict';
import test from 'node:test';
import {sarafanRasterHero} from '../src/project-hero/raster-definition.mjs';
import {rasterPreviewVariants, rasterVariantDefinition} from '../src/project-hero/raster-variants.mjs';
import {carouselCards, visibleDotIndexes} from '../src/project-hero/raster-carousel.mjs';

test('variant space exposes 2, 3, 4 and 5+ image states', () => {
  assert.deepEqual(rasterPreviewVariants.map(variant => [variant.id, variant.count]),
    [['2', 2], ['3', 3], ['4', 4], ['5+', 8]]);
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
    assert.ok(carouselCards(slides, 6).length <= 5);
  }
});

test('the 5+ fixture reaches its sixth, seventh and eighth images', () => {
  const slides = rasterVariantDefinition(sarafanRasterHero, '5+').contexts[0].slides;
  for (const index of [5, 6, 7]) {
    assert.equal(carouselCards(slides, index).find(card => card.slot === 0)?.slide.id, slides[index].id);
    assert.equal(visibleDotIndexes(index, slides.length).length, 5);
  }
});
