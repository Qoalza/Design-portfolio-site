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
  assert.match(css,/\.step-icon-background\{[^}]*rgba\(67,162,238,\.2\)[^}]*var\(--background-mask\)/);
  assert.match(css,/\.step-icon-fill\{[^}]*#1d90eb/);
  assert.match(css,/\.step-icon-background,\.step-icon-fill\{transition-duration:400ms\}/);
  assert.match(css,/\.step\.is-fill-active \.step-icon-background,\.step\.is-fill-active \.step-icon-fill\{--fill-radius:96px\}/);
  assert.match(app,/process-background-mask-\$\{index\+1\}\.svg/);
  assert.match(app,/exitTimer\.current=setTimeout\(\(\)=>\{settledOutside\.current=true\},200\)/);
});

test('process card hover and focus share the exact Figma visual state',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
  assert.match(app,/className="step-divider"/);
  assert.match(app,/active\?'is-fill-active':''/);
  assert.match(app,/onPointerEnter=\{\(\)=>begin\('pointer'\)\}/);
  assert.match(app,/onFocus=\{\(\)=>begin\('focus'\)\}/);
  assert.match(css,/\.step-divider\{[^}]*height:1px[^}]*background:var\(--border\)/);
  assert.match(css,/\.step-divider::after\{[^}]*background:#1d90eb[^}]*scaleX\(\.749\)[^}]*150ms ease-in/);
  assert.match(css,/\.step\.is-fill-active \.step-divider::after\{transform:scaleX\(1\)\}/);
  assert.match(css,/\.step-number span\{[^}]*color:#676e73/);
  assert.match(css,/\.step-text h3\{[^}]*color:#adb3b8/);
  assert.match(css,/\.step-text p\{[^}]*color:#676e73/);
  assert.match(css,/\.step\.is-fill-active \.step-number span,\.step\.is-fill-active \.step-text h3\{color:#dadde0\}/);
  assert.match(css,/\.step\.is-fill-active \.step-text p\{color:#adb3b8\}/);
});
