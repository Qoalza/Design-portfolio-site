import assert from 'node:assert/strict';
import test from 'node:test';
import {carouselCards, nearestCarouselStep, wrapSlideIndex} from '../src/project-hero/raster-carousel.mjs';

test('raster carousel keeps three visible roles while cycling through three images', () => {
  const slides = [{id: 'delivery'}, {id: 'home'}, {id: 'variant'}];
  const initial = carouselCards(slides, 1);
  assert.deepEqual(initial.filter(card => Math.abs(card.slot) <= 1).map(card => card.slide.id),
    ['delivery', 'home', 'variant']);

  const next = carouselCards(slides, 2);
  assert.deepEqual(next.filter(card => Math.abs(card.slot) <= 1).map(card => card.slide.id),
    ['home', 'variant', 'delivery']);
  assert.deepEqual(initial.map(card => card.key).filter(key => next.some(item => item.key === key)),
    [0, 1, 2, 3]);
});

test('raster carousel only mounts nearby images regardless of list length', () => {
  const slides = Array.from({length: 24}, (_, index) => ({id: String(index)}));
  assert.equal(carouselCards(slides, 0).length, 5);
  assert.deepEqual(carouselCards(slides, 0).map(card => card.slide.id),
    ['22', '23', '0', '1', '2']);
  assert.equal(carouselCards([slides[0]], 0).length, 1);
  assert.deepEqual(carouselCards([], 0), []);
});

test('dot navigation uses the shortest wrapped direction', () => {
  assert.equal(nearestCarouselStep(0, 6, 7), -1);
  assert.equal(nearestCarouselStep(1, 3, 7), 3);
  assert.equal(wrapSlideIndex(-1, 7), 6);
});
