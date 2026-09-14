import assert from 'node:assert/strict';
import test from 'node:test';

import {activeExperienceIndex,EXPERIENCE_PATTERN_MIN_HEIGHT,experienceLayout,experiencePatternVisible,experienceReachedIndexes,experienceSegmentProgress,experienceStops,experienceTravel,horizontalSpeedBlur,scrollProgress} from '../src/experience-layout.mjs';
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

test('experience runs center-to-center and is ten percent faster',()=>{
  assert.deepEqual(experienceTravel(),{horizontal:2047,vertical:9690/1.1});
  assert.deepEqual(experienceStops(),[0,374/2047,759/2047,1162/2047,1581/2047,1]);
  assert.ok(800/experienceTravel().vertical<.2);
});

test('experience activation follows each node through the viewport center',()=>{
  const stops=experienceStops();
  stops.forEach((stop,index)=>assert.equal(activeExperienceIndex(stop),index));
  assert.equal(experienceSegmentProgress(stops[2],1),1);
  assert.equal(experienceSegmentProgress(stops[2],2),0);
});

test('experience hides both pattern fields below the 48px visual threshold',()=>{
  assert.equal(EXPERIENCE_PATTERN_MIN_HEIGHT,48);
  assert.equal(experiencePatternVisible(47.999),false);
  assert.equal(experiencePatternVisible(48),true);
});

test('Experience keeps one geometry when it enters the sticky range',()=>{
  assert.deepEqual(experienceLayout(900),{outer:0,center:900,free:0,headingGap:42,tapeTop:24,progressGap:108,bottom:80,scale:1});
});

test('experience keeps the Figma track geometry visible to the sticky viewport',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  const responsive=await readFile(path.resolve(import.meta.dirname,'../src/responsive.css'),'utf8');
  const source=await readFile(path.resolve(import.meta.dirname,'../src/Experience.jsx'),'utf8');
  assert.match(css,/#root\{overflow:visible\}/);
  assert.match(css,/\.experience\{overflow:visible\}/);
  assert.match(css,/\.experience-path\.line-128\{left:192px\}/);
  assert.match(css,/\.experience-progress\{[^}]*width:296px;[^}]*height:2px/);
  assert.match(css,/\.experience-progress-fill,\.experience-progress-glow\{[^}]*background:#1d90eb/);
  assert.doesNotMatch(source,/className="experience-progress"[^\n]*<i/);
  assert.match(css,/\.experience-job:not\(\.current\)\.is-reached \.experience-node\{/);
  assert.match(source,/className="date-marker date-marker-start"/);
  assert.match(source,/className="date-marker-line"/);
  assert.match(source,/className="date-marker date-marker-end"/);
  assert.match(css,/\.experience-dates\{[^}]*height:44px;[^}]*align-items:flex-start/);
  assert.match(css,/\.date-rail\{[^}]*width:32px;[^}]*align-self:stretch;[^}]*padding-block:4px;[^}]*gap:8px/);
  assert.match(css,/\.date-marker\{[^}]*width:4px;[^}]*height:4px/);
  assert.match(css,/\.date-marker-line\{[^}]*width:1px;[^}]*height:12px/);
  assert.match(css,/\.experience-job:not\(\.current\)\.is-reached \.date-marker-end \.date-marker-reached/);
  assert.match(css,/\.experience-job:not\(\.current\)\.is-reached \.experience-dates b:first-child\{color:#676e73\}/);
  assert.doesNotMatch(css,/\.experience-pattern::before,\.experience-pattern::after/);
  assert.doesNotMatch(css,/experience-pattern-(?:top|bottom)\.png/);
  assert.match(source,/className="experience-pattern-grid"/);
  assert.match(css,/\.experience-pattern\{[^}]*overflow:hidden/);
  assert.match(css,/\.experience-sticky:not\(\.has-pattern-fields\) \.experience-pattern\{visibility:hidden\}/);
  assert.match(source,/classList\.toggle\('has-pattern-fields',experiencePatternVisible\(layout\.outer\)\)/);
  assert.match(css,/\.experience-pattern-grid\{[^}]*width:min\(1280px,100%\);[^}]*height:100%;[^}]*border-inline:1px solid #2e3133/);
  assert.match(css,/\.experience-pattern-grid\{background-image:url\('\/figma\/dot-tile\.svg'\);background-size:16px 16px;background-position:0 0\}/);
  assert.doesNotMatch(css,/\.experience-pattern-grid\{[^}]*radial-gradient/);
  assert.match(css,/\.pattern-top\{[^}]*border-bottom:1px solid #2e3133/);
  assert.match(css,/\.pattern-bottom\{[^}]*border-top:1px solid #2e3133/);
  assert.match(source,/className="experience-fade experience-fade-left"/);
  assert.match(source,/className="experience-fade experience-fade-right"/);
  assert.match(css,/\.experience-window\{width:min\(1280px,100%\)\}/);
  assert.match(css,/\.experience-track\{left:50%;transform:translateX\(calc\(-164px \+ var\(--experience-shift\)\)\)\}/);
  assert.match(css,/\.experience-fade-left,\.experience-fade-right\{width:240px\}/);
  assert.match(css,/\.experience-fade-left\{left:0;right:auto;width:109px;background:linear-gradient\(to right,#131414 3\.31%,rgba\(19,20,20,0\)\)\}/);
  assert.match(css,/\.experience-fade-right\{right:0;width:280px;background:linear-gradient\(to left,#131414 3\.31%,rgba\(19,20,20,0\)\)\}/);
  assert.match(css,/\.experience-fade-left\{opacity:0\}/);
  assert.match(css,/\.experience\.is-started \.experience-fade-left\{opacity:1\}/);
  assert.doesNotMatch(css,/\.experience\.is-complete \.experience-fade-left\{opacity:0\}/);
  assert.doesNotMatch(css,/\.experience\.is-started:not\(\.is-complete\) \.experience-fade-left/);
  assert.match(source,/section\.classList\.toggle\('is-started',progress>0\)/);
  assert.match(source,/section\.classList\.toggle\('is-complete',progress>=1\)/);
  assert.match(source,/top=section\.getBoundingClientRect\(\)\.top\+window\.scrollY/);
  assert.match(source,/const layout=experienceLayout\(window\.innerHeight\)/);
  assert.match(source,/section\.style\.height=window\.innerWidth>=1280\?`\$\{window\.innerHeight\+VERTICAL_TRAVEL\}px`:'auto'/);
  assert.doesNotMatch(source,/createExperienceEntryGate|scrollTo\(top,\{immediate:true,force:true\}\)|lenis\.stop\(\)/);
  assert.match(css,/\.experience-sticky\{position:sticky;top:0;height:100svh/);
  assert.doesNotMatch(source,/is-header-offset|HEADER_RESERVE|experienceStickyHeaderOffset|experienceCompactPinnedSpacing/);
  assert.doesNotMatch(css,/\.experience\.is-header-offset|--experience-heading-offset|\.experience-heading\{transform:translateY/);
  const tabletBlock=responsive.slice(responsive.indexOf('@media(max-width:1279px)'),responsive.indexOf('@media(min-width:1280px)'));
  assert.match(tabletBlock,/\.experience-sticky\{position:relative;top:auto;height:auto;display:block;overflow:visible\}/);
  assert.match(tabletBlock,/\.experience-track \.experience-job\{position:relative;left:auto;top:auto;width:auto/);
});

test('one normalized document progress drives the full horizontal travel',()=>{
  assert.equal(scrollProgress({scrollY:1000,sectionTop:1000,verticalTravel:900}),0);
  assert.equal(scrollProgress({scrollY:1450,sectionTop:1000,verticalTravel:900}),.5);
  assert.equal(scrollProgress({scrollY:1900,sectionTop:1000,verticalTravel:900}),1);
});

test('the reached storyboard stop selects its matching experience item',()=>{
  const stops=experienceStops();
  assert.equal(activeExperienceIndex(0),0);
  assert.equal(activeExperienceIndex(stops[1]-.0001),0);
  assert.equal(activeExperienceIndex(stops[1]),1);
  assert.equal(activeExperienceIndex(stops[3]),3);
  assert.equal(activeExperienceIndex(1),5);
});

test('experience states remain reached until reverse progress withdraws the path',()=>{
  const stops=experienceStops();
  assert.deepEqual(experienceReachedIndexes(0),[0]);
  assert.deepEqual(experienceReachedIndexes(stops[1]-.0001),[0]);
  assert.deepEqual(experienceReachedIndexes(stops[1]),[0,1]);
  assert.deepEqual(experienceReachedIndexes(stops[3]),[0,1,2,3]);
  assert.deepEqual(experienceReachedIndexes(1),[0,1,2,3,4,5]);
  assert.deepEqual(experienceReachedIndexes(stops[2]-.0001),[0,1]);
});

test('tape blur is zero through 100px/s and reaches .6px at 1800px/s',()=>{
  assert.equal(horizontalSpeedBlur(100),0);
  assert.equal(horizontalSpeedBlur(950),.3);
  assert.equal(horizontalSpeedBlur(1800),.6);
});

test('desktop experience grid stays in the center while masks retain timeline edge fades',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  assert.match(css,/\.experience-center\{background-color:#131414;background-image:linear-gradient\(rgba\(46,49,51,\.16\)/);
  assert.match(css,/background-size:96px 96px/);
  assert.match(css,/\.experience-pattern\{background:#131414\}/);
  assert.match(css,/\.experience-window\{-webkit-mask-image:linear-gradient\(to right,#000 0,#000 calc\(100% - 240px\),transparent 100%\)/);
  assert.match(css,/\.experience\.is-started \.experience-window\{-webkit-mask-image:linear-gradient\(to right,transparent 0,#000 240px/);
  assert.doesNotMatch(css,/\.experience\.is-started:not\(\.is-complete\) \.experience-window/);
  assert.match(css,/\.experience-fade\{display:none\}/);
});

test('decorative dot fields use the exact 3px Figma tile without changing functional markers',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  const tile=await readFile(path.resolve(import.meta.dirname,'../public/figma/dot-tile.svg'),'utf8');
  assert.equal(tile,'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="1.5" fill="#232526"/></svg>\n');
  assert.match(css,/\.about-pattern\{background-image:url\('\/figma\/dot-tile\.svg'\);background-size:16px 16px;background-position:0 0\}/);
  assert.match(css,/\.experience-pattern-grid\{background-image:url\('\/figma\/dot-tile\.svg'\);background-size:16px 16px;background-position:0 0\}/);
  assert.match(css,/\.about-dots button::before\{content:"";width:6px;height:6px/);
  assert.match(css,/\.experience-node\{[^}]*width:32px;height:32px/);
});
