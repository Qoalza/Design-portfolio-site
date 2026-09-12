import assert from 'node:assert/strict';
import test from 'node:test';

import {experienceLayout,horizontalSpeedBlur,scrollProgress} from '../src/experience-layout.mjs';

test('experience height adaptation follows the contracted priority order',()=>{
  assert.deepEqual(experienceLayout(1644),{outer:240,center:1164,free:129,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1});
  assert.deepEqual(experienceLayout(1280),{outer:127,center:1026,free:60,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1});
  const compact=experienceLayout(720);
  assert.equal(compact.outer,0);
  assert.equal(compact.center,720);
  assert.equal(compact.free,0);
  assert.equal(compact.headingGap,0);
  assert.equal(compact.tapeTop,0);
  assert.equal(compact.progressGap,24);
  assert.equal(compact.bottom,50);
  assert.equal(compact.scale,1);
});

test('one normalized document progress drives the full horizontal travel',()=>{
  assert.equal(scrollProgress({scrollY:1000,sectionTop:1000,verticalTravel:900}),0);
  assert.equal(scrollProgress({scrollY:1450,sectionTop:1000,verticalTravel:900}),.5);
  assert.equal(scrollProgress({scrollY:1900,sectionTop:1000,verticalTravel:900}),1);
});

test('tape blur is zero through 100px/s and reaches .6px at 1800px/s',()=>{
  assert.equal(horizontalSpeedBlur(100),0);
  assert.equal(horizontalSpeedBlur(950),.3);
  assert.equal(horizontalSpeedBlur(1800),.6);
});
