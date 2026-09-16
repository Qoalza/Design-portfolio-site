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

test('process icon, line, and dots use the user-approved 300ms duration',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
  const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
  assert.match(css,/\.step-icon-background\{[^}]*rgba\(67,162,238,\.2\)[^}]*var\(--background-mask\)/);
  assert.match(css,/\.step-icon-fill\{[^}]*#1d90eb/);
  assert.match(css,/\.step-icon-background,\.step-icon-fill\{transition-duration:300ms\}/);
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
  assert.match(css,/\.step-divider::after\{[^}]*background:var\(--cv2-border-accent-muted\)[^}]*scaleX\(0\)[^}]*transform-origin:center[^}]*300ms ease-in/);
  assert.match(css,/\.step\.is-fill-active \.step-divider::after\{transform:scaleX\(1\)\}/);
  assert.match(css,/\.step-number span\{[^}]*color:var\(--cv2-text-neutral-muted\)/);
  assert.match(css,/\.step-text h3\{[^}]*color:var\(--cv2-text-neutral-tertiary\)/);
  assert.match(css,/\.step-text p\{[^}]*color:var\(--cv2-text-neutral-muted\)/);
  assert.match(css,/\.step\.is-fill-active \.step-number span,\.step\.is-fill-active \.step-text h3\{color:var\(--cv2-text-neutral-secondary\)/);
  assert.match(css,/\.step-dots\{[^}]*color:var\(--cv2-text-neutral-muted\)[^}]*300ms ease-in/);
  assert.match(css,/\.step\.is-fill-active \.step-dots\{color:#43a2ee\}/);
  assert.match(css,/\.step\.is-fill-active \.step-text p\{color:var\(--cv2-text-neutral-tertiary\)\}/);
  assert.match(app,/className="step-dots"[^>]*--dots-mask/);
});

test('Process keeps its approved 300ms motion while using the current text and border roles',async()=>{
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 assert.match(css,/\.step-number span\{[^}]*color:var\(--cv2-text-neutral-muted\)/);
 assert.match(css,/\.step-dots\{[^}]*color:var\(--cv2-text-neutral-muted\)/);
 assert.match(css,/\.step-text h3\{[^}]*color:var\(--cv2-text-neutral-tertiary\)/);
 assert.match(css,/\.step\.is-fill-active \.step-number span,\.step\.is-fill-active \.step-text h3\{color:var\(--cv2-text-neutral-secondary\)/);
  assert.match(css,/\.step-divider::after\{[^}]*transition:transform 300ms ease-in/);
});

test('desktop Process uses one upper divider and decorative hatches use the Figma stroke',async()=>{
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 assert.match(css,/:root\{--cv2-decoration-hatch:#222629\}/);
 assert.match(css,/\.steps\{[^}]*background:var\(--border\)[^}]*border-top:0[^}]*border-bottom:0/);
 assert.match(css,/\.step-divider\{[^}]*height:1px[^}]*background:var\(--border\)/);
 assert.match(css,/\.ai-side\{background:repeating-linear-gradient\(135deg,transparent 0 14px,var\(--cv2-decoration-hatch\) 14px 15px\)\}/);
 assert.match(css,/\.about-hatch\{background:repeating-linear-gradient\(126\.826deg,var\(--cv2-decoration-hatch\) 0 1px,transparent 1px 15px\)\}/);
 assert.match(css,/\.about-dash-horizontal::before\{background:repeating-linear-gradient\(to right,var\(--cv2-border-neutral-surface\) 0 16px,transparent 16px 32px\)\}/);
 assert.match(css,/\.about-divider\{background:repeating-linear-gradient\(to bottom,var\(--cv2-border-neutral-surface\) 0 16px,transparent 16px 32px\)\}/);
 assert.match(css,/\.experience-pattern-grid::before,\.experience-pattern-grid::after\{background:repeating-linear-gradient\(to bottom,var\(--cv2-decoration-hatch\) 0 16px,transparent 16px 32px\)\}/);
});
