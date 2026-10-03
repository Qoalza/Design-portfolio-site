import assert from 'node:assert/strict';
import test from 'node:test';
import {carouselCards, nearestCarouselStep, visibleDotIndexes, wrapSlideIndex} from '../src/project-hero/raster-carousel.mjs';

test('two images trade center and side without rendering a duplicate', () => {
  const slides = [{id: 'delivery'}, {id: 'home'}];
  const initial = carouselCards(slides, 1);
  assert.deepEqual(initial.map(card => [card.key, card.slide.id, card.slot]),
    [['slide-0', 'delivery', -1], ['slide-1', 'home', 0]]);
  assert.deepEqual(carouselCards(slides, 2).map(card => [card.key, card.slide.id, card.slot]),
    [['slide-0', 'delivery', 0], ['slide-1', 'home', 1]]);
});

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

test('dot window shows every image up to five and stays capped beyond five', () => {
  for (const count of [2, 3, 4, 5]) {
    assert.deepEqual(visibleDotIndexes(1, count), Array.from({length: count}, (_, index) => index));
  }
  assert.deepEqual(visibleDotIndexes(0, 8), [6, 7, 0, 1, 2]);
  assert.deepEqual(visibleDotIndexes(6, 8), [4, 5, 6, 7, 0]);
  assert.equal(visibleDotIndexes(7, 8).length, 5);
});

test('sixth and later images remain reachable while only five cards are mounted', () => {
  const slides = Array.from({length: 8}, (_, index) => ({id: String(index)}));
  assert.deepEqual(carouselCards(slides, 6).map(card => card.slide.id), ['4', '5', '6', '7', '0']);
  assert.deepEqual(carouselCards(slides, 7).map(card => card.slide.id), ['5', '6', '7', '0', '1']);
  assert.equal(wrapSlideIndex(8, slides.length), 0);
});

test('dot navigation uses the shortest wrapped direction', () => {
  assert.equal(nearestCarouselStep(0, 6, 7), -1);
  assert.equal(nearestCarouselStep(1, 3, 7), 3);
  assert.equal(wrapSlideIndex(-1, 7), 6);
});
