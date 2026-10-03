import assert from 'node:assert/strict';
import test from 'node:test';
import {carouselCardLayer, carouselCards, carouselClipPath, carouselDotItems, carouselIncomingClip, carouselOutgoingClip, carouselShadeStops, carouselSlotVisual, nearestCarouselStep, nextCarouselStep, visibleDotIndexes, wrapSlideIndex} from '../src/project-hero/raster-carousel.mjs';

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

test('raster carousel mounts nearby images and never shows more than five', () => {
  const slides = Array.from({length: 24}, (_, index) => ({id: String(index)}));
  const cards = carouselCards(slides, 0);
  assert.equal(cards.length, 7);
  assert.deepEqual(cards.filter(card => carouselSlotVisual(card.slot, true).opacity).map(card => card.slide.id),
    ['22', '23', '0', '1', '2']);
  assert.equal(carouselCards([slides[0]], 0).length, 1);
  assert.deepEqual(carouselCards([], 0), []);
});

test('five-plus outer card moves into a hidden buffer before it is removed', () => {
  const slides = Array.from({length: 8}, (_, index) => ({id: String(index)}));
  const before = carouselCards(slides, 0);
  const after = carouselCards(slides, 1);
  assert.deepEqual(before.map(card => card.slot), [-3, -2, -1, 0, 1, 2, 3]);
  assert.equal(before.filter(card => Math.abs(card.slot) <= 2).length, 5);
  assert.equal(after.find(card => card.key === before.find(item => item.slot === -2).key)?.slot, -3);
  assert.equal(carouselSlotVisual(-3, true).opacity, 0);
  assert.equal(carouselSlotVisual(3, true).opacity, 0);
  assert.equal(carouselSlotVisual(2, true).opacity, 1);
  assert.equal(carouselSlotVisual(2, false).opacity, 0);
  assert.equal(after.find(card => card.slot === 3)?.slide.id, slides[4].id);
  const jump = carouselCards(slides, 2);
  assert.deepEqual(before.filter(card => Math.abs(card.slot) <= 2 && !jump.some(next => next.key === card.key)).map(card => card.slot), [-2]);
});

test('five-plus outer shade matches the nearest shade across its exposed width', () => {
  const near = carouselShadeStops(260);
  const far = carouselShadeStops(382);
  const nearScale = 640 / 940;
  const farScale = .55;
  const darkness = (position, stops, scale) => (position / scale - stops.start) / (stops.end - stops.start);
  for (const fraction of [0, .5, 1]) {
    const nearDarkness = darkness(110 * fraction, near, nearScale);
    const farDarkness = darkness(60 * fraction, far, farScale);
    assert.ok(Math.abs(nearDarkness - farDarkness) < .001);
  }
  const middle = carouselShadeStops(321);
  assert.ok(middle.start > near.start && middle.start < far.start);
  assert.ok(middle.end < near.end && middle.end > far.end);
});

test('outgoing center reveals the incoming card continuously while moving aside', () => {
  for (const [showFive, distance, exposed] of [[false, 320, 170], [true, 260, 110]]) {
    const inset = 100 * (1 - exposed / 640);
    assert.deepEqual(carouselOutgoingClip(-distance, showFive), {left: 0, right: inset});
    assert.deepEqual(carouselOutgoingClip(distance, showFive), {left: inset, right: 0});
    assert.equal(carouselClipPath({left: 0, right: inset}), `inset(0 ${inset}% 0 0% round 16px)`);
    assert.equal(carouselClipPath({left: inset, right: 0}), `inset(0 0% 0 ${inset}% round 16px)`);
    const halfInset = 100 * (1 - ((940 + exposed) / 2) / 790);
    assert.deepEqual(carouselOutgoingClip(-distance / 2, showFive), {left: 0, right: halfInset});
    assert.deepEqual(carouselOutgoingClip(0, showFive), {left: 0, right: 0});
    for (const progress of [0, .25, .5, .75, 1]) {
      const outgoingWidth = 940 - 300 * progress;
      const incomingWidth = 640 + 300 * progress;
      const outgoingX = -distance * progress;
      const incomingX = distance * (1 - progress);
      const outgoing = carouselOutgoingClip(outgoingX, showFive);
      const incoming = carouselIncomingClip(incomingX, showFive);
      const outgoingEdge = outgoingX - outgoingWidth / 2 + outgoingWidth * (1 - outgoing.right / 100);
      const incomingEdge = incomingX - incomingWidth / 2 + incomingWidth * incoming.left / 100;
      assert.ok(Math.abs(outgoingEdge - incomingEdge) < .001);
    }
    assert.equal(carouselCardLayer(-1, showFive, true), 4);
    assert.equal(carouselCardLayer(0, showFive), 3);
    assert.equal(carouselCardLayer(1, showFive), 2);
    assert.equal(carouselCardLayer(2, showFive), showFive ? 1 : 0);
  }
});

test('distant dot targets advance through visible adjacent cards', () => {
  assert.equal(nextCarouselStep(0, 2), 1);
  assert.equal(nextCarouselStep(1, 2), 2);
  assert.equal(nextCarouselStep(2, -1), 1);
  for (const count of [2, 3, 4, 8]) {
    const slides = Array.from({length: count}, (_, index) => ({id: String(index)}));
    const before = carouselCards(slides, 0);
    const incoming = carouselCards(slides, 1).find(card => card.slot === 0);
    assert.equal(before.find(card => card.key === incoming.key)?.slot, 1);
  }
});

test('dot window shows every image up to five and stays capped beyond five', () => {
  for (const count of [2, 3, 4, 5]) {
    assert.deepEqual(visibleDotIndexes(1, count), Array.from({length: count}, (_, index) => index));
  }
  assert.deepEqual(visibleDotIndexes(0, 8), [6, 7, 0, 1, 2]);
  assert.deepEqual(visibleDotIndexes(6, 8), [4, 5, 6, 7, 0]);
  assert.equal(visibleDotIndexes(7, 8).length, 5);
});

test('five-dot window retains dot identities while moving and shrinks its ends', () => {
  const slides = Array.from({length: 8}, (_, index) => ({id: String(index)}));
  const before = carouselDotItems(slides, 0);
  const after = carouselDotItems(slides, 1);
  assert.equal(before.filter(dot => dot.visible).length, 5);
  assert.deepEqual(before.filter(dot => dot.visible).map(dot => dot.index), [6, 7, 0, 1, 2]);
  assert.deepEqual(after.filter(dot => dot.visible).map(dot => dot.index), [7, 0, 1, 2, 3]);
  assert.deepEqual(before.filter(dot => dot.visible && dot.compact).map(dot => dot.slot), [-2, 2]);
  assert.equal(before.find(dot => dot.key === 0).slot, 0);
  assert.equal(after.find(dot => dot.key === 0).slot, -1);
  assert.equal(carouselDotItems(slides.slice(0, 5), 2).filter(dot => dot.compact).length, 2);
});

test('sixth and later images remain reachable while only five cards are visible', () => {
  const slides = Array.from({length: 8}, (_, index) => ({id: String(index)}));
  assert.deepEqual(carouselCards(slides, 6).filter(card => carouselSlotVisual(card.slot, true).opacity).map(card => card.slide.id), ['4', '5', '6', '7', '0']);
  assert.deepEqual(carouselCards(slides, 7).filter(card => carouselSlotVisual(card.slot, true).opacity).map(card => card.slide.id), ['5', '6', '7', '0', '1']);
  assert.equal(wrapSlideIndex(8, slides.length), 0);
});

test('dot navigation uses the shortest wrapped direction', () => {
  assert.equal(nearestCarouselStep(0, 6, 7), -1);
  assert.equal(nearestCarouselStep(1, 3, 7), 3);
  assert.equal(wrapSlideIndex(-1, 7), 6);
});
