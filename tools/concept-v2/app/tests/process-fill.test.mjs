import assert from 'node:assert/strict';
import test from 'node:test';

import {randomEdgePoint} from '../src/process-fill.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

test('process fill origin is always on one frame edge',()=>{
  const samples=[0,.24,.25,.49,.5,.74,.75,.99];
  const points=samples.map(value=>randomEdgePoint(()=>value));
  for(const {x,y} of points)assert.ok(x===0||x===64||y===0||y===64);
});

test('edge origin stays inside the full 64px icon frame',()=>{
  const values=[.999,.5];
  const point=randomEdgePoint(()=>values.shift());
  assert.deepEqual(point,{x:32,y:64});
});

test('process icon and background fill use the user-approved 400ms duration',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
  assert.match(css,/\.step-icon::before\{[^}]*#0378d6[^}]*transition:--fill-radius 400ms/);
  assert.match(css,/\.step-icon-fill\{transition-duration:400ms\}/);
  assert.match(css,/\.step\.is-fill-active \.step-icon::before,\.step\.is-fill-active \.step-icon-fill\{--fill-radius:96px\}/);
  assert.match(app,/exitTimer\.current=setTimeout\(\(\)=>\{settledOutside\.current=true\},200\)/);
});
