import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import path from 'node:path';

test('the single root Lenis loop owns wheel input without a duplicate native listener',async()=>{
  const source=await readFile(path.resolve(import.meta.dirname,'../src/SmoothScroll.jsx'),'utf8');
  assert.equal(source.match(/new Lenis\(/g)?.length,1);
  assert.match(source,/autoRaf:false,smoothWheel:true,syncTouch:false,/);
  assert.match(source,/lerp:\.1,wheelMultiplier:1,stopInertiaOnNavigate:true/);
  assert.doesNotMatch(source,/addEventListener\(['"]wheel/);
  assert.match(source,/publishSmoothScroll\(lenis\)/);
  assert.match(source,/publishSmoothScroll\(undefined\)/);
  assert.match(source,/cancelAnimationFrame\(frame\)/);
  assert.match(source,/lenis\?\.destroy\(\)/);
});

test('scroll, resize, visibility, and pulse work is removed on unmount',async()=>{
  const experience=await readFile(path.resolve(import.meta.dirname,'../src/Experience.jsx'),'utf8');
  const pulse=await readFile(path.resolve(import.meta.dirname,'../src/RoutePulse.jsx'),'utf8');
  assert.match(experience,/clearTimeout\(blurTimer\)/);
  assert.match(experience,/removeEventListener\('scroll',paint\)/);
  assert.match(experience,/removeEventListener\('resize',onResize\)/);
  assert.match(experience,/reduced\.removeEventListener\('change',paint\)/);
  assert.match(pulse,/stop\?\.\(\)/);
  assert.match(pulse,/observer\.disconnect\(\)/);
  assert.match(pulse,/motion\.removeEventListener\('change',sync\)/);
  assert.match(pulse,/document\.removeEventListener\('visibilitychange',sync\)/);
});

test('native scrollbar never changes the layout viewport while Lenis stops',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  assert.match(css,/html\{[^}]*scrollbar-width:none;[^}]*-ms-overflow-style:none/);
  assert.match(css,/html::-webkit-scrollbar\{[^}]*display:none;[^}]*width:0;[^}]*height:0/);
});
