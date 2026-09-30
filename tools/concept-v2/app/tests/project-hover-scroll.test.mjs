import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {publishScrollActivity,subscribeScrollActivity} from '../src/smooth-scroll-runtime.mjs';

test('scroll activity synchronously exposes only state transitions and initializes late subscribers',()=>{
  const received=[];
  const unsubscribe=subscribeScrollActivity(active=>received.push(active));
  publishScrollActivity(true);
  publishScrollActivity(true);
  publishScrollActivity(false);
  assert.deepEqual(received,[false,true,false]);
  unsubscribe();
});

test('the sole Lenis owner publishes immediate input activity and settled scroll state',async()=>{
  const source=await readFile(path.resolve(import.meta.dirname,'../src/SmoothScroll.jsx'),'utf8');
  assert.match(source,/lenis\.on\('virtual-scroll',\(\)=>publishScrollActivity\(true\)\)/);
  assert.match(source,/lenis\.on\('scroll',instance=>publishScrollActivity\(instance\.isScrolling\)\)/);
  assert.match(source,/publishScrollActivity\(false\)/);
});

test('project hover remains available during scrolling without a projects scroll gate',async()=>{
  const runtime=await readFile(path.resolve(import.meta.dirname,'../src/smooth-scroll-runtime.mjs'),'utf8');
  const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  assert.doesNotMatch(runtime,/bindScrollHoverGate/);
  assert.doesNotMatch(app,/bindScrollHoverGate/);
  assert.match(css,/\.project:hover \.project-front-layer/);
  assert.match(css,/\.project:hover \.project-glow/);
  assert.doesNotMatch(css,/\.projects-section\[data-scroll-active\]/);
  assert.doesNotMatch(css,/\.projects-section:not\(\[data-scroll-active\]\)/);
});
