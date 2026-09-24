import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {bindScrollHoverGate,publishScrollActivity,subscribeScrollActivity} from '../src/smooth-scroll-runtime.mjs';

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

test('project hover stays suspended after scroll until the pointer moves again',()=>{
  const dataset={};
  const listeners=new Map();
  const pointerTarget={
    addEventListener(type,listener){listeners.set(type,listener)},
    removeEventListener(type,listener){if(listeners.get(type)===listener)listeners.delete(type)},
  };
  const unbind=bindScrollHoverGate({dataset},pointerTarget);

  publishScrollActivity(true);
  assert.equal(dataset.scrollActive,'true');
  publishScrollActivity(false);
  assert.equal(dataset.scrollActive,'true');
  assert.equal(typeof listeners.get('pointermove'),'function');

  publishScrollActivity(true);
  assert.equal(listeners.has('pointermove'),false);
  assert.equal(dataset.scrollActive,'true');
  publishScrollActivity(false);
  assert.equal(typeof listeners.get('pointermove'),'function');

  listeners.get('pointermove')();
  assert.equal(dataset.scrollActive,undefined);
  assert.equal(listeners.has('pointermove'),false);

  unbind();
  publishScrollActivity(false);
});

test('scroll activity controls only the projects hover gate without a React render',async()=>{
  const runtime=await readFile(path.resolve(import.meta.dirname,'../src/smooth-scroll-runtime.mjs'),'utf8');
  const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  assert.doesNotMatch(runtime,/document\.documentElement\.dataset\.scrollActive/);
  assert.match(app,/import \{bindScrollHoverGate\} from '\.\/smooth-scroll-runtime\.mjs'/);
  assert.match(app,/bindScrollHoverGate\(section\)/);
  assert.doesNotMatch(app,/is-scrolling/);
  assert.match(css,/\.projects-section:not\(\[data-scroll-active\]\) \.project:hover/);
  assert.match(css,/\.projects-section\[data-scroll-active\] \.project:hover [^{]+\{transition:none\}/);
  assert.doesNotMatch(css,/html(?:\:not\()?\[data-scroll-active\]/);
});
