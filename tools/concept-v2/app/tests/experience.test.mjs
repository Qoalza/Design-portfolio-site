import assert from 'node:assert/strict';
import test from 'node:test';

import {activeExperienceIndex,experienceCompletionTransition,experienceLayout,experienceReachedIndexes,experienceSegmentProgress,experienceShouldPaint,experienceStops,experienceTravel,horizontalSpeedBlur,scrollProgress} from '../src/experience-layout.mjs';
import {createExperienceEntryGate,ENTRY_GESTURE_IDLE_MS} from '../src/experience-entry-gate.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

test('experience height adaptation follows the contracted priority order',()=>{
  assert.deepEqual(experienceLayout(1644),{outer:240,topOuter:240,bottomOuter:0,center:1404,free:249,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1,compact:false,compactOffset:0});
  assert.deepEqual(experienceLayout(1600),{outer:240,topOuter:240,bottomOuter:0,center:1360,free:227,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1,compact:false,compactOffset:0});
  assert.deepEqual(experienceLayout(1440),{outer:240,topOuter:240,bottomOuter:0,center:1200,free:147,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1,compact:false,compactOffset:0});
  assert.deepEqual(experienceLayout(1280),{outer:116,topOuter:116,bottomOuter:0,center:1164,free:129,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1,compact:false,compactOffset:0});
  assert.deepEqual(experienceLayout(1080),{outer:0,topOuter:0,bottomOuter:0,center:1080,free:87,headingGap:48,tapeTop:24,progressGap:108,bottom:80,scale:1,compact:false,compactOffset:0});
  assert.deepEqual(experienceLayout(900),{outer:0,topOuter:0,bottomOuter:0,center:900,free:0,headingGap:42,tapeTop:24,progressGap:108,bottom:80,scale:1,compact:true,compactOffset:128});
  const compact=experienceLayout(720);
  assert.equal(compact.outer,0);
  assert.equal(compact.center,720);
  assert.equal(compact.free,0);
  assert.equal(compact.headingGap,0);
  assert.equal(compact.tapeTop,0);
  assert.equal(compact.progressGap,24);
  assert.equal(compact.bottom,50);
  assert.equal(compact.scale,560/642);
  assert.equal(compact.compact,true);
  assert.equal(compact.compactOffset,128);

  const short=experienceLayout(490);
  assert.equal(short.outer,0);
  assert.equal(short.center,490);
  assert.equal(short.headingGap,0);
  assert.equal(short.tapeTop,0);
  assert.equal(short.progressGap,24);
  assert.equal(short.bottom,24);
  assert.equal(short.scale,330/642);
  assert.equal(short.compact,true);
  assert.equal(short.compactOffset,128);
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

test('Experience keeps one geometry when it enters the sticky range',()=>{
  assert.deepEqual(experienceLayout(900),{outer:0,topOuter:0,bottomOuter:0,center:900,free:0,headingGap:42,tapeTop:24,progressGap:108,bottom:80,scale:1,compact:true,compactOffset:128});
});

test('About photo viewer keeps the completed Experience geometry while body scroll is locked',async()=>{
  const source=await readFile(path.resolve(import.meta.dirname,'../src/Experience.jsx'),'utf8');
  const readPhase=source.split('read:payload=>{')[1]?.split('write:(')[0];
  assert.match(readPhase,/if\(document\.body\.style\.position==='fixed'\)\{positionDirty=true;return \{documentLocked:true\};\}/);
});

test('large Experience keeps its upper field while the lower field is removed',()=>{
  const layout=experienceLayout(1318);
  assert.equal(layout.topOuter,154);
  assert.equal(layout.bottomOuter,0);
  assert.equal(layout.topOuter+layout.center+layout.bottomOuter,1318);
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
  assert.match(source,/<GridPattern\/>/);
  assert.doesNotMatch(source,/pattern-bottom/);
  assert.match(css,/\.experience-pattern\{[^}]*overflow:hidden/);
  assert.match(css,/\.experience-pattern-grid\{[^}]*width:min\(1280px,100%\);[^}]*height:100%;[^}]*transform:translateX\(-50%\)/);
  assert.match(css,/\.experience-pattern-grid\{border-inline:0\}/);
  assert.match(css,/\.experience-pattern-grid::before,\.experience-pattern-grid::after\{[^}]*width:1px;[^}]*background:repeating-linear-gradient\(to bottom,var\(--cv2-border-neutral-surface\) 0 16px,transparent 16px 32px\)/);
  assert.match(css,/\.experience-pattern-grid::before\{left:0\}/);
  assert.match(css,/\.experience-pattern-grid::after\{right:0\}/);
  assert.match(css,/\.experience-pattern-grid\{background-image:url\('\/figma\/dot-tile\.svg'\);background-size:16px 16px;background-position:0 0\}/);
  assert.doesNotMatch(css,/\.experience-pattern-grid\{[^}]*radial-gradient/);
  assert.doesNotMatch(css,/\.experience-pattern\.pattern-top\{[^}]*border-bottom/);
  assert.doesNotMatch(css,/\.experience-sticky:not\(\.has-pattern-fields\) \.experience-pattern\{visibility:hidden\}/);
  assert.match(source,/className="experience-fade experience-fade-left"/);
  assert.match(source,/className="experience-fade experience-fade-right"/);
  assert.match(css,/\.experience-window\{width:min\(1280px,100%\)\}/);
  assert.match(css,/\.experience-track\{left:50%;transform:translateX\(calc\(-164px \+ var\(--experience-shift\)\)\)\}/);
  assert.match(css,/\.experience-fade-left,\.experience-fade-right\{width:240px\}/);
  assert.match(css,/\.experience-fade-left\{left:0;right:auto;width:109px;background:linear-gradient\(to right,var\(--cv2-container-neutral-faint\) 3\.31%,rgba\(20,21,23,0\)\)\}/);
  assert.match(css,/\.experience-fade-right\{right:0;width:280px;background:linear-gradient\(to left,var\(--cv2-container-neutral-faint\) 3\.31%,rgba\(20,21,23,0\)\)\}/);
  assert.match(css,/\.experience-fade-left\{opacity:0\}/);
  assert.match(css,/\.experience\.is-started \.experience-fade-left\{opacity:1\}/);
  assert.doesNotMatch(css,/\.experience\.is-complete \.experience-fade-left\{opacity:0\}/);
  assert.doesNotMatch(css,/\.experience\.is-started:not\(\.is-complete\) \.experience-fade-left/);
  assert.match(source,/const started=progress>0,complete=progress>=1/);
  assert.match(source,/section\.classList\.toggle\('is-started',started\)/);
  assert.match(source,/section\.classList\.toggle\('is-complete',complete\)/);
  assert.match(source,/sectionTop=section\.getBoundingClientRect\(\)\.top\+window\.scrollY/);
  assert.match(source,/const layout=experienceLayout\(window\.innerHeight\)/);
  assert.match(source,/const height=desktop\?`\$\{window\.innerHeight\+\(completed\?0:VERTICAL_TRAVEL\)\}px`:'auto'/);
  assert.match(source,/section\.classList\.toggle\('is-compact',layout\.compact\)/);
  assert.match(source,/createExperienceEntryGate/);
  assert.match(source,/scrollTo\(sectionTop,\{immediate:true,force:true\}\)/);
  assert.match(source,/lenis\.stop\(\)/);
  assert.match(css,/\.experience-sticky\{position:sticky;top:0;height:100svh/);
  assert.match(css,/grid-template-rows:var\(--experience-top-outer\) var\(--experience-center\)/);
  assert.doesNotMatch(source,/is-header-offset|HEADER_RESERVE|experienceStickyHeaderOffset|experienceCompactPinnedSpacing/);
  assert.doesNotMatch(css,/\.experience\.is-header-offset|--experience-heading-offset/);
  assert.match(css,/\.experience\.is-compact \.experience-center\{align-items:flex-start\}/);
  assert.match(css,/\.experience\.is-compact \.experience-composition\{transform:translateY\(var\(--experience-compact-offset\)\) scale\(var\(--experience-scale\)\);transform-origin:top center\}/);
  assert.match(css,/\.experience\.is-compact \.experience-heading\{transform:translateY\(-16px\)\}/);
  assert.match(css,/\.experience\.is-compact \.experience-progress\{display:none\}/);
  const tabletBlock=responsive.slice(responsive.indexOf('@media(max-width:1279px)'),responsive.indexOf('@media(min-width:1280px)'));
  assert.match(tabletBlock,/\.experience-sticky\{position:relative;top:auto;height:auto;display:block;overflow:visible\}/);
  assert.match(tabletBlock,/\.experience-track \.experience-job\{position:relative;left:auto;top:auto;width:auto/);
});

test('one normalized document progress drives the full horizontal travel',()=>{
  assert.equal(scrollProgress({scrollY:1000,sectionTop:1000,verticalTravel:900}),0);
  assert.equal(scrollProgress({scrollY:1450,sectionTop:1000,verticalTravel:900}),.5);
  assert.equal(scrollProgress({scrollY:1900,sectionTop:1000,verticalTravel:900}),1);
});

test('a completed Experience keeps its final scene on reverse scroll and rearms only below the viewport',()=>{
 const sectionTop=3000,viewportHeight=900,verticalTravel=1000;
 const input={sectionTop,viewportHeight,verticalTravel};
 assert.deepEqual(experienceCompletionTransition({...input,completed:false,scrollY:4000}),{completed:false});
 assert.deepEqual(experienceCompletionTransition({...input,completed:false,scrollY:4001}),{completed:true,scrollY:3001});
 assert.deepEqual(experienceCompletionTransition({...input,completed:true,scrollY:3000}),{completed:true});
 assert.deepEqual(experienceCompletionTransition({...input,completed:true,scrollY:2100}),{completed:true});
 assert.deepEqual(experienceCompletionTransition({...input,completed:true,scrollY:2099}),{completed:false});
});

test('Experience does heavy scroll work only within two viewports of its section',()=>{
  const input={viewportHeight:900,sectionTop:3000,sectionHeight:9700};
  assert.equal(experienceShouldPaint({...input,scrollY:1199}),false);
  assert.equal(experienceShouldPaint({...input,scrollY:1200}),true);
  assert.equal(experienceShouldPaint({...input,scrollY:12700}),true);
  assert.equal(experienceShouldPaint({...input,scrollY:14501}),false);
});

test('Experience caches geometry and DOM targets and batches scroll work to one frame',async()=>{
  const source=await readFile(path.resolve(import.meta.dirname,'../src/Experience.jsx'),'utf8');
  assert.match(source,/const jobs=\[\.\.\.section\.querySelectorAll\('\.experience-job'\)\]/);
  assert.match(source,/const paths=\[\.\.\.section\.querySelectorAll\('\.experience-path-progress'\)\]/);
  assert.match(source,/createFrameTask/);
  assert.match(source,/const paintTask=createFrameTask/);
  assert.match(source,/function schedulePaint\(payload\)\{paintTask\.schedule\(payload\);\}/);
  assert.match(source,/const resizeObserver=new ResizeObserver\(invalidatePosition\)/);
  assert.match(source,/\['\.hero-shell','\.body-sections','\.ai-section'\]/);
  assert.match(source,/subscribeLayoutInvalidation\(invalidatePosition\)/);
  assert.match(source,/if\(document\.body\.style\.position==='fixed'\)return false/);
  assert.match(source,/function syncGate\(currentScrollY\)/);
  assert.match(source,/syncGate\(currentScrollY\);\n\s*if\(!experienceShouldPaint/);
  assert.match(source,/if\(!desktop\)\{resetStatic\(\);return;\}/);
  assert.match(source,/if\(states\.started!==false\)\{states\.started=false;section\.classList\.remove\('is-started'\);\}/);
  assert.match(source,/if\(states\.complete!==false\)\{states\.complete=false;section\.classList\.remove\('is-complete'\);\}/);
  assert.match(source,/blurTimer=blur>0\?setTimeout/);
  assert.match(source,/experienceShouldPaint/);
  assert.doesNotMatch(source,/section\.querySelectorAll\('\.experience-job'\)\.forEach/);
  assert.doesNotMatch(source,/section\.querySelectorAll\('\.experience-path-progress'\)\.forEach/);
});

test('Experience entry consumes the incoming gesture and releases only the next one',()=>{
  let nextId=0;
  const timers=new Map();
  const gate=createExperienceEntryGate({
    schedule:(callback,delay)=>{
      const id=++nextId;
      timers.set(id,{callback,delay});
      return id;
    },
    cancel:id=>timers.delete(id),
  });

  gate.capture();
  assert.equal(gate.state,'holding');
  for(let index=0;index<8;index+=1){
    assert.equal(gate.onVirtualScroll({deltaY:80}),false,'every event in the incoming wheel stream remains blocked');
  }
  assert.deepEqual([...new Set([...timers.values()].map(timer=>timer.delay))],[ENTRY_GESTURE_IDLE_MS],'a continuous input stream has no hard time-based release');
  const idle=[...timers.values()].find(timer=>timer.delay===ENTRY_GESTURE_IDLE_MS);
  idle.callback();
  assert.equal(gate.state,'armed');
  assert.equal(gate.onVirtualScroll({deltaY:80}),true,'a later gesture begins Experience progress');
  assert.equal(gate.state,'released');
  gate.reset();
  gate.capture();
  assert.equal(gate.onVirtualScroll({deltaY:-20}),true,'reversing before release leaves the section normally');
  assert.equal(gate.state,'idle');
});

test('a renewed wheel impulse releases Experience before the inertial tail fully idles',()=>{
  const gate=createExperienceEntryGate({schedule:()=>1,cancel:()=>{}});
  gate.capture();
  for(const deltaY of [32,20,12,6,3]){
    assert.equal(gate.onVirtualScroll({deltaY}),false,'the decaying entry gesture stays blocked');
  }
  assert.equal(gate.onVirtualScroll({deltaY:6}),false,'the first rising event identifies a possible renewed gesture');
  assert.equal(gate.onVirtualScroll({deltaY:14}),true,'the continued rise releases the renewed gesture immediately');
  assert.equal(gate.state,'released');
});

test('a second wheel gesture releases Experience without pointer movement or a larger delta',()=>{
  const gate=createExperienceEntryGate({schedule:()=>1,cancel:()=>{}});
  assert.equal(gate.onVirtualScroll({deltaY:24,event:{timeStamp:100}}),false,'the entry wheel event is observed before the section captures');
  gate.capture();
  for(const [deltaY,timeStamp] of [[18,116],[10,132],[4,148]]){
    assert.equal(gate.onVirtualScroll({deltaY,event:{timeStamp}}),false,'the uninterrupted inertial tail stays blocked');
  }
  assert.equal(gate.onVirtualScroll({deltaY:4,event:{timeStamp:212}}),true,'a later wheel gesture releases even when its first delta is not larger');
  assert.equal(gate.state,'released');
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

test('desktop Experience uses the current 20px grid on 320px tiles while masks retain timeline edge fades',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  const pattern=await readFile(path.resolve(import.meta.dirname,'../src/GridPattern.jsx'),'utf8');
  const tile=await readFile(path.resolve(import.meta.dirname,'../public/figma/surface-grid-tile-16191c-191e21.svg'),'utf8');
  const source=await readFile(path.resolve(import.meta.dirname,'../src/Experience.jsx'),'utf8');
  assert.match(css,/\.experience-center\{position:relative;[^}]*background:var\(--cv2-container-neutral-faint\)\}/);
  assert.match(pattern,/export function GridPattern\(\)/);
  assert.match(pattern,/className="surface-grid-pattern"/);
  assert.doesNotMatch(pattern,/className=''/);
  assert.match(source,/<GridPattern\/>/);
  assert.match(tile,/<svg[^>]*width="320"[^>]*height="320"[^>]*viewBox="0 0 320 320"/);
  assert.match(tile,/<g fill="#16191c">/);
  assert.match(tile,/<g fill="#191e21">/);
  assert.match(tile,/<rect x="20" y="0" width="1" height="320"\/>/);
  assert.match(tile,/<rect x="0" y="20" width="320" height="1"\/>/);
  assert.match(tile,/<rect x="0" y="0" width="1" height="320"\/>/);
  assert.match(tile,/<rect x="0" y="0" width="320" height="1"\/>/);
  assert.doesNotMatch(tile,/x="320"|y="320"/);
  assert.match(css,/\.surface-grid-pattern\{[^}]*position:absolute;[^}]*inset:0;[^}]*pointer-events:none;[^}]*opacity:\.7;[^}]*background-image:url\('\/figma\/surface-grid-tile-16191c-191e21\.svg'\);[^}]*background-size:320px 320px;[^}]*background-position:calc\(50% - 640px\) 0;[^}]*background-repeat:repeat/);
  assert.doesNotMatch(css,/\.surface-grid-pattern\{[^}]*linear-gradient/);
  assert.match(css,/\.experience-center>\.surface-grid-pattern\{display:none\}/);
  assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.experience-center>\.surface-grid-pattern\{[^}]*z-index:0;[^}]*display:block/);
  assert.match(css,/\.experience-pattern\{background:var\(--cv2-container-neutral-faint\)\}/);
  assert.match(css,/\.experience-window\{-webkit-mask-image:linear-gradient\(to right,#000 0,#000 calc\(100% - 240px\),transparent 100%\)/);
  assert.match(css,/\.experience\.is-started \.experience-window\{-webkit-mask-image:linear-gradient\(to right,transparent 0,#000 240px/);
  assert.doesNotMatch(css,/\.experience\.is-started:not\(\.is-complete\) \.experience-window/);
  assert.match(css,/\.experience-fade\{display:none\}/);
});

test('desktop Experience owns the full-width separator before About',async()=>{
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.experience-center\{[^}]*box-sizing:border-box[^}]*border-bottom:1px solid var\(--cv2-border-neutral-thin\)/);
 assert.doesNotMatch(css,/\.about-section\{[^}]*border-top/);
});

test('Experience heading keeps scroll orchestration while Resume remains its full Figma control',async()=>{
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 const source=await readFile(path.resolve(import.meta.dirname,'../src/Experience.jsx'),'utf8');
 assert.match(css,/\.experience-heading\{[^}]*padding-inline:8px/);
 assert.match(css,/\.experience-heading>div>p:last-child\{[^}]*color:var\(--cv2-text-neutral-secondary\)/);
 assert.match(source,/export function Experience\(\{cv\}\)/);
 assert.match(source,/className="experience-resume" variant="light" href=\{cv\} external iconRight="file05">Резюме<\/ControlButton>/);
 assert.doesNotMatch(source,/\/\/ все сложное – просто/);
 assert.match(css,/\.experience-resume\{width:105px\}/);
 assert.match(css,/\.experience-pattern\{[^}]*background:var\(--cv2-container-neutral-faint\)/);
 assert.match(source,/createExperienceEntryGate/);
 assert.match(source,/subscribeSmoothScroll/);
});

test('decorative upper field keeps the exact 3px Figma tile without changing functional markers',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  const tile=await readFile(path.resolve(import.meta.dirname,'../public/figma/dot-tile.svg'),'utf8');
  assert.equal(tile,'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="1.5" fill="#232526"/></svg>\n');
  assert.match(css,/\.experience-pattern-grid\{background-image:url\('\/figma\/dot-tile\.svg'\);background-size:16px 16px;background-position:0 0\}/);
  assert.doesNotMatch(css,/\.experience-grid\{[^}]*dot-tile\.svg/);
  assert.match(css,/\.about-dots button::before\{content:"";width:6px;height:6px/);
  assert.match(css,/\.experience-node\{[^}]*width:32px;height:32px/);
});
