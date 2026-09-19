import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {publishScrollActivity,subscribeScrollActivity} from '../src/smooth-scroll-runtime.mjs';

test('scroll activity only publishes state transitions and initializes late subscribers',()=>{
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
