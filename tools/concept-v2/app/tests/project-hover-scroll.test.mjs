import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {publishScrollActivity,subscribeScrollActivity} from '../src/smooth-scroll-runtime.mjs';

test('scroll activity synchronously exposes only state transitions and initializes late subscribers',()=>{
  const previousDocument=globalThis.document;
  const dataset={};
  globalThis.document={documentElement:{dataset}};
  const received=[];
  const unsubscribe=subscribeScrollActivity(active=>received.push(active));
  publishScrollActivity(true);
  assert.equal(dataset.scrollActive,'true');
  publishScrollActivity(true);
  publishScrollActivity(false);
  assert.equal(dataset.scrollActive,undefined);
  assert.deepEqual(received,[false,true,false]);
  unsubscribe();
  globalThis.document=previousDocument;
});

test('the sole Lenis owner publishes immediate input activity and settled scroll state',async()=>{
  const source=await readFile(path.resolve(import.meta.dirname,'../src/SmoothScroll.jsx'),'utf8');
  assert.match(source,/lenis\.on\('virtual-scroll',\(\)=>publishScrollActivity\(true\)\)/);
  assert.match(source,/lenis\.on\('scroll',instance=>publishScrollActivity\(instance\.isScrolling\)\)/);
  assert.match(source,/publishScrollActivity\(false\)/);
});

test('scroll activity controls the document-level hover gate without a React render',async()=>{
  const runtime=await readFile(path.resolve(import.meta.dirname,'../src/smooth-scroll-runtime.mjs'),'utf8');
  const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
  assert.match(runtime,/document\.documentElement\.dataset\.scrollActive='true'/);
  assert.match(runtime,/delete document\.documentElement\.dataset\.scrollActive/);
  assert.doesNotMatch(app,/subscribeScrollActivity/);
  assert.doesNotMatch(app,/is-scrolling/);
});
