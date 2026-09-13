import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import path from 'node:path';

test('the single root Lenis loop halves wheel input without intercepting it',async()=>{
  const source=await readFile(path.resolve(import.meta.dirname,'../src/SmoothScroll.jsx'),'utf8');
  assert.equal(source.match(/new Lenis\(/g)?.length,1);
  assert.match(source,/autoRaf:false,smoothWheel:true,syncTouch:false,/);
  assert.match(source,/lerp:\.1,wheelMultiplier:\.5,stopInertiaOnNavigate:true/);
  assert.doesNotMatch(source,/addEventListener\(['"]wheel/);
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
