import assert from 'node:assert/strict';
import test from 'node:test';

import {activeExperienceIndex,experienceLayout,experienceTravel,horizontalSpeedBlur,scrollProgress} from '../src/experience-layout.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

test('experience height adaptation follows the contracted priority order',()=>{
  assert.deepEqual(experienceLayout(1644),{outer:240,center:1164,free:129,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1});
  assert.deepEqual(experienceLayout(1600),{outer:240,center:1120,free:107,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1});
  assert.deepEqual(experienceLayout(1440),{outer:207,center:1026,free:60,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1});
  assert.deepEqual(experienceLayout(1280),{outer:127,center:1026,free:60,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1});
  assert.deepEqual(experienceLayout(1080),{outer:27,center:1026,free:60,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1});
  assert.deepEqual(experienceLayout(900),{outer:0,center:900,free:0,headingGap:42,tapeTop:24,progressGap:108,bottom:80,scale:1});
  const compact=experienceLayout(720);
  assert.equal(compact.outer,0);
  assert.equal(compact.center,720);
  assert.equal(compact.free,0);
  assert.equal(compact.headingGap,0);
  assert.equal(compact.tapeTop,0);
  assert.equal(compact.progressGap,24);
  assert.equal(compact.bottom,50);
  assert.equal(compact.scale,1);

  const short=experienceLayout(490);
  assert.equal(short.outer,0);
  assert.equal(short.center,490);
  assert.equal(short.headingGap,0);
  assert.equal(short.tapeTop,0);
  assert.equal(short.progressGap,24);
  assert.equal(short.bottom,24);
  assert.equal(short.scale,490/694);
});

test('experience uses 1.5 vertical pixels for every horizontal pixel',()=>{
  assert.deepEqual(experienceTravel(),{horizontal:1615,vertical:2422.5});
});

test('experience keeps the Figma track geometry visible to the sticky viewport',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  const responsive=await readFile(path.resolve(import.meta.dirname,'../src/responsive.css'),'utf8');
  const source=await readFile(path.resolve(import.meta.dirname,'../src/Experience.jsx'),'utf8');
  assert.match(css,/#root\{overflow:visible\}/);
  assert.match(css,/\.experience\{overflow:visible\}/);
  assert.match(css,/\.experience-path\.line-128\{left:192px\}/);
  assert.match(css,/\.experience-progress\{[^}]*width:296px;[^}]*height:4px/);
  assert.match(css,/\.experience-progress-fill,\.experience-progress-glow\{[^}]*background:#1d90eb/);
  assert.doesNotMatch(source,/className="experience-progress"[^\n]*<i/);
  assert.match(css,/\.experience-job:not\(\.current\)\.is-active \.experience-node\{/);
  assert.match(css,/\.experience-dates\{height:44px;align-items:center\}/);
  assert.match(css,/\.date-rail\{height:40px;flex:0 0 32px\}/);
  const tabletBlock=responsive.slice(responsive.indexOf('@media(max-width:1279px)'),responsive.indexOf('@media(min-width:1280px)'));
  assert.match(tabletBlock,/\.experience-sticky\{position:relative;height:auto;display:block;overflow:visible\}/);
  assert.match(tabletBlock,/\.experience-track \.experience-job\{position:relative;left:auto;top:auto;width:auto/);
});

test('one normalized document progress drives the full horizontal travel',()=>{
  assert.equal(scrollProgress({scrollY:1000,sectionTop:1000,verticalTravel:900}),0);
  assert.equal(scrollProgress({scrollY:1450,sectionTop:1000,verticalTravel:900}),.5);
  assert.equal(scrollProgress({scrollY:1900,sectionTop:1000,verticalTravel:900}),1);
});

test('the reached storyboard stop selects its matching experience item',()=>{
  assert.equal(activeExperienceIndex(0),0);
  assert.equal(activeExperienceIndex(.1999),0);
  assert.equal(activeExperienceIndex(.2),1);
  assert.equal(activeExperienceIndex(.6),3);
  assert.equal(activeExperienceIndex(1),5);
});

test('tape blur is zero through 100px/s and reaches .6px at 1800px/s',()=>{
  assert.equal(horizontalSpeedBlur(100),0);
  assert.equal(horizontalSpeedBlur(950),.3);
  assert.equal(horizontalSpeedBlur(1800),.6);
});
