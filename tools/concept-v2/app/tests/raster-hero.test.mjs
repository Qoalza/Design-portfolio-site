import {readFile} from 'node:fs/promises';
import {sarafanRasterHero} from '../src/project-hero/raster-definition.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {StackedCarousel} from 'react-stacked-center-carousel';
import {carouselDotItems, nearestCarouselStep, visibleDotIndexes, wrapSlideIndex} from '../src/project-hero/raster-carousel.mjs';

test('chosen stacked carousel renders whole cards and caps visible cards at five', () => {
  for (const count of [3, 5, 7]) {
    const maxVisibleSlide = Math.min(count, 5);
    const markup = renderToStaticMarkup(React.createElement(StackedCarousel, {
      data: Array.from({length: count}, (_, index) => ({id: index})),
      slideComponent: ({data, dataIndex}) => React.createElement('div', null, data[dataIndex].id),
      carouselWidth: 1280,
      slideWidth: 940,
      height: 928,
      maxVisibleSlide,
      customScales: maxVisibleSlide === 3 ? [1, 640 / 940, .5] : [1, 640 / 940, .55, .45],
      fadeDistance: 0,
    }));
    assert.equal((markup.match(/opacity:1/g) ?? []).length, maxVisibleSlide);
    assert.doesNotMatch(markup, /clip-path/);
  }
});

test('three images keep a fixed dot for each image', () => {
  for (const count of [3]) {
    const slides = Array.from({length: count}, (_, index) => ({id: String(index)}));
    const dots = carouselDotItems(slides, 1);
    assert.deepEqual(dots.map(dot => dot.index), Array.from({length: count}, (_, index) => index));
    assert.equal(dots.filter(dot => dot.visible).length, count);
    assert.deepEqual(visibleDotIndexes(1, count), Array.from({length: count}, (_, index) => index));
  }
});

test('five and larger galleries keep the active dot centered across repeated wraps',()=>{
 for(const count of [5,6,7]){
  const slides=Array.from({length:count},(_,index)=>({id:String(index)}));
  for(const step of [-count-1,-1,0,1,count-1,count,count+1]){
   const dots=carouselDotItems(slides,step),visible=dots.filter(dot=>dot.visible);
   assert.equal(visible.length,5);
   assert.equal(new Set(visible.map(dot=>dot.index)).size,5);
   assert.equal(visible.find(dot=>dot.index===wrapSlideIndex(step,count)).slot,0);
   assert.deepEqual(visible.map(dot=>dot.index),visibleDotIndexes(wrapSlideIndex(step,count),count));
   for(const direction of [-1,1]){
    const next=carouselDotItems(slides,step+direction);
    assert.equal(next.find(dot=>dot.key===step).slot,-direction);
   }
  }
 }
});

test('seven images cycle through a five-dot window with smaller outer dots', () => {
  const slides = Array.from({length: 7}, (_, index) => ({id: String(index)}));
  const before = carouselDotItems(slides, 0);
  const after = carouselDotItems(slides, 1);
  assert.deepEqual(before.filter(dot => dot.visible).map(dot => dot.index), [5, 6, 0, 1, 2]);
  assert.deepEqual(after.filter(dot => dot.visible).map(dot => dot.index), [6, 0, 1, 2, 3]);
  assert.deepEqual(before.filter(dot => dot.visible && dot.compact).map(dot => dot.slot), [-2, 2]);
  assert.equal(before.find(dot => dot.key === 0).slot, 0);
  assert.equal(after.find(dot => dot.key === 0).slot, -1);
  assert.equal(carouselDotItems(slides, 7).filter(dot => dot.visible).length, 5);
});

test('navigation reaches the seventh image and wraps in the shortest direction', () => {
  assert.equal(nearestCarouselStep(1, 6, 7), -1);
  assert.equal(nearestCarouselStep(6, 0, 7), 7);
  assert.equal(wrapSlideIndex(7, 7), 0);
  assert.deepEqual(visibleDotIndexes(6, 7), [4, 5, 6, 0, 1]);
});

// Keep the original export pixels: no downsampled carousel intermediates.
test('Sarafan hero uses full-resolution lossless WebP exports', async()=>{
 for(const slide of sarafanRasterHero.contexts[0].slides){
  assert.match(slide.src,/\.webp$/);
  const bytes=await readFile(new URL('../public'+slide.src,import.meta.url));
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');
  assert.equal(bytes.subarray(12,16).toString(),'VP8L');
  const dimensions=bytes.readUInt32LE(21);
  assert.equal((dimensions&0x3fff)+1,4096);
  assert.equal(((dimensions>>>14)&0x3fff)+1,2958);
 }
});
