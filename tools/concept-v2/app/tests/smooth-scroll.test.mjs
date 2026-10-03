import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import path from 'node:path';

test('the single root Lenis loop owns wheel input without a duplicate native listener',async()=>{
  const source=await readFile(path.resolve(import.meta.dirname,'../src/SmoothScroll.jsx'),'utf8');
  assert.equal(source.match(/new Lenis\(/g)?.length,1);
  assert.match(source,/autoRaf:false,smoothWheel:true,syncTouch:false,/);
  assert.match(source,/lerp:\.1,wheelMultiplier:1,stopInertiaOnNavigate:true/);
  assert.match(source,/createWheelInputProfile\(\)/);
  assert.match(source,/createWheelHandlingProfile\(\)/);
  assert.match(source,/virtualScroll:\(\{event\}\)=>/);
  assert.doesNotMatch(source,/lenis\.options\.smoothWheel=/);
  assert.match(source,/document\.querySelector\('\.experience'\)/);
  assert.match(source,/experienceObserver=new ResizeObserver\(measureExperience\)/);
  assert.match(source,/isProtectedWheelRegion\(\{scrollY:window\.scrollY,deltaY:event\.deltaY,\.\.\.experienceBounds,viewportHeight:window\.innerHeight\}\)/);
  assert.match(source,/wheelHandlingProfile\.observe\(\{event,input,protectedRegionVisible\}\)/);
  assert.match(source,/experienceObserver\?\.disconnect\(\)/);
  assert.doesNotMatch(source,/new IntersectionObserver/);
  assert.doesNotMatch(source,/getBoundingClientRect\(\)[\s\S]{0,300}resolveWheelHandling/);
  assert.match(source,/dataset\.scrollHandling=nextHandling/);
  assert.match(source,/if\(nextHandling==='native'\)/);
  assert.match(source,/shouldResetSmoothScroll\(\{previousHandling:wheelHandling,nextHandling,isScrolling:lenis\.isScrolling\}\)/);
  assert.doesNotMatch(source,/if\(nextHandling!==wheelHandling\)\{\s*lenis\.reset\(\)/);
  assert.match(source,/publishScrollActivity\(true\);\s*return false/);
  assert.doesNotMatch(source,/addEventListener\(['"]wheel/);
  assert.match(source,/publishSmoothScroll\(lenis\)/);
  assert.match(source,/publishSmoothScroll\(undefined\)/);
  assert.match(source,/cancelAnimationFrame\(frame\)/);
  assert.match(source,/lenis\?\.destroy\(\)/);
});

test('the mouse-versus-trackpad policy is mounted once above every Concept V2 route',async()=>{
  const main=await readFile(path.resolve(import.meta.dirname,'../src/main.jsx'),'utf8');
  assert.equal(main.match(/<SmoothScroll\/>/g)?.length,1);
  assert.match(main,/createRoot\(document\.getElementById\('root'\)\)\.render\(<React\.StrictMode>\s*<SmoothScroll\/>/);
  assert.doesNotMatch(main,/<FirstVisit><SmoothScroll\/>/);
});

test('scroll, resize, visibility, and pulse work is removed on unmount',async()=>{
  const experience=await readFile(path.resolve(import.meta.dirname,'../src/Experience.jsx'),'utf8');
  const pulse=await readFile(path.resolve(import.meta.dirname,'../src/RoutePulse.jsx'),'utf8');
  assert.match(experience,/clearTimeout\(blurTimer\)/);
  assert.match(experience,/removeEventListener\('scroll',onScroll\)/);
  assert.match(experience,/paintTask\.dispose\(\)/);
  assert.match(experience,/resizeObserver\.disconnect\(\)/);
  assert.match(experience,/unsubscribeLayoutInvalidation\(\)/);
  assert.match(experience,/removeEventListener\('resize',onResize\)/);
  assert.match(experience,/removeEventListener\('visibilitychange',onVisibilityChange\)/);
  assert.match(experience,/reduced\.removeEventListener\('change',onMotionChange\)/);
  assert.match(pulse,/controller\?\.stop\(\)/);
  assert.match(pulse,/unsubscribeScroll\(\)/);
  assert.match(pulse,/activity\.dispose\(\)/);
  assert.match(pulse,/task\.dispose\(\)/);
  assert.match(pulse,/resizeObserver\.disconnect\(\)/);
  assert.match(pulse,/motion\.removeEventListener\('change',onMotionChange\)/);
});

test('native scrollbar never changes the layout viewport while Lenis stops',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  assert.match(css,/html\{[^}]*scrollbar-width:none;[^}]*-ms-overflow-style:none/);
  assert.match(css,/html::-webkit-scrollbar\{[^}]*display:none;[^}]*width:0;[^}]*height:0/);
});

test('header pins only after its original area leaves the viewport and uses Border/Surface below',async()=>{
 const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 const responsive=await readFile(path.resolve(import.meta.dirname,'../src/responsive.css'),'utf8');
 assert.match(app,/className=\{`site-header-shell\$\{pinned\?' is-pinned':''\}`\}/);
 assert.match(app,/<div id="top" ref=\{shell\} className=\{`site-header-shell/);
 assert.doesNotMatch(app,/<header[^>]+id="top"/);
 assert.match(app,/const paintTask=createFrameTask\(\{read:\(\)=>window\.scrollY>threshold,write:paint\}\)/);
 assert.match(app,/const thresholdTask=createFrameTask\(\{read:\(\)=>shell\.current\?\.offsetHeight\?\?80/);
 assert.match(app,/const observer=new ResizeObserver\(invalidateThreshold\)/);
 assert.match(app,/window\.addEventListener\('scroll',schedule,\{passive:true\}\)/);
 assert.match(app,/removeEventListener\('scroll',schedule\)/);
 assert.match(app,/paintTask\.dispose\(\);thresholdTask\.dispose\(\);observer\.disconnect\(\)/);
 assert.match(app,/setLeaving\(true\)/);
 assert.match(app,/exitTimer=setTimeout\(\(\)=>\{pinnedRef\.current=false;leavingRef\.current=false;setPinned\(false\);setLeaving\(false\)\},150\)/);
 assert.match(css,/\.site-header\.is-pinned\{position:fixed;z-index:20;inset:0 0 auto;background:var\(--page\);box-shadow:inset 0 -1px var\(--border\);will-change:transform;animation:header-enter 150ms ease-out both\}/);
 assert.match(css,/\.site-header\.is-unpinning\{animation:header-exit 150ms ease-in both\}/);
 assert.match(css,/\.site-header-shell\.is-pinned\{z-index:20\}/);
 assert.match(css,/@keyframes header-enter\{from\{transform:translateY\(-100%\)\}to\{transform:translateY\(0\)\}\}/);
 assert.match(css,/@keyframes header-exit\{from\{transform:translateY\(0\)\}to\{transform:translateY\(-100%\)\}\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{/);
 assert.match(css,/\.site-header\.is-pinned,\.process-caption-content\{animation:none\}/);
 assert.match(responsive,/\.site-header-shell,\.site-header,\.header-row,\.brand\{height:72px\}/);
});
