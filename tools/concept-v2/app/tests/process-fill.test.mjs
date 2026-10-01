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
  assert.match(css,/\.step-icon-hover\{[^}]*clip-path:circle\(var\(--fill-radius\) at var\(--fill-x\) var\(--fill-y\)\)[^}]*300ms ease-in/);
  assert.match(css,/\.step\.is-fill-active \.step-icon-hover\{--fill-radius:96px\}/);
  assert.match(css,/\.step-icon-background,\.step-icon-fill\{[^}]*transition:--fill-radius 300ms ease-in/);
  assert.match(css,/\.step\.is-fill-active \.step-icon-background,\.step\.is-fill-active \.step-icon-fill\{--fill-radius:96px\}/);
  assert.match(app,/className="step-icon-hover" src=\{`\/figma\/\$\{step\.image\}-hover\.svg`\}/);
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
  assert.match(app,/className="step-grid" aria-hidden="true"/);
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

test('desktop Process uses clean exact Figma assets while retaining the existing responsive icons',async()=>{
 for(const name of ['imgFrame26086399.svg','imgFrame26086400.svg','imgFrame26086401.svg']){
  const svg=await readFile(path.resolve(import.meta.dirname,'../public/figma',name),'utf8');
  assert.match(svg,/Rectangle (?:11|12|13|14)|#2D3438/);
  const desktop=await readFile(path.resolve(import.meta.dirname,`../public/figma/${name.replace('.svg','-desktop.svg')}`),'utf8');
  for(const color of ['#1D2124','#475157','#747F87'])assert.ok(desktop.includes(color),`${name} desktop lacks ${color}`);
  assert.doesNotMatch(desktop,/Rectangle (?:11|12|13|14)|#2D3438/);
  assert.doesNotMatch(desktop,/#202122|#676E73|#ADB3B8|#2E3133/);
  const hover=await readFile(path.resolve(import.meta.dirname,`../public/figma/${name.replace('.svg','-hover.svg')}`),'utf8');
  for(const color of ['#141617','#43A2EE','#1D90EB','#62B8FC'])assert.ok(hover.includes(color),`${name} hover lacks ${color}`);
  assert.match(hover,/fill-opacity="0\.15"/);
 }
});

test('Process keeps its approved 300ms motion while using the current text and border roles',async()=>{
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 assert.match(css,/\.step-number span\{[^}]*color:var\(--cv2-text-neutral-muted\)/);
 assert.match(css,/\.step-dots\{[^}]*color:var\(--cv2-text-neutral-muted\)/);
 assert.match(css,/\.step-text h3\{[^}]*color:var\(--cv2-text-neutral-tertiary\)/);
 assert.match(css,/\.step\.is-fill-active \.step-number span,\.step\.is-fill-active \.step-text h3\{color:var\(--cv2-text-neutral-secondary\)/);
  assert.match(css,/\.step-divider::after\{[^}]*transition:transform 300ms ease-in/);
});

test('desktop Process matches the current 4150:804103 card geometry and preserves existing motion',async()=>{
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
 const fade=await readFile(path.resolve(import.meta.dirname,'../public/figma/process-grid-fade.svg'),'utf8');
 assert.match(css,/:root\{--cv2-decoration-hatch:#1d2124\}/);
 assert.match(css,/\.steps\{[^}]*grid-template-columns:minmax\(0,401fr\) minmax\(0,446fr\) minmax\(0,401fr\)[^}]*gap:16px[^}]*background:transparent[^}]*border:0/);
 assert.match(css,/\.step\{[^}]*height:297px[^}]*padding:0[^}]*border:1px solid var\(--cv2-border-neutral-thin\)[^}]*border-radius:12px[^}]*background:var\(--surface\)/);
 assert.match(css,/\.step-body\{[^}]*position:absolute[^}]*left:-1px[^}]*right:-1px[^}]*top:0[^}]*height:296px[^}]*display:flex[^}]*gap:48px[^}]*padding:36px/);
 assert.match(css,/\.step-grid\{[^}]*width:214px[^}]*height:194px[^}]*overflow:hidden[^}]*border-radius:12px 0 0 0/);
 assert.match(css,/\.step-grid\{[^}]*background-image:linear-gradient\(to right,#272d30 0 1px,transparent 1px 36px\),linear-gradient\(to bottom,#272d30 0 1px,transparent 1px 36px\)[^}]*background-position:-1px -1px,-1px -1px/);
 assert.match(css,/\.step-grid::after\{[^}]*inset:-1px 0 0 -1px[^}]*background:url\('\/figma\/process-grid-fade\.svg'\) center\/100% 100% no-repeat/);
 assert.match(css,/\.step-grid::before\{[^}]*#173954[^}]*opacity:0[^}]*300ms ease-in/);
 assert.match(css,/\.step\.is-fill-active \.step-grid::before\{opacity:1\}/);
 assert.doesNotMatch(css,/\.step::after\{/);
 assert.doesNotMatch(css,/\.step>\*\{position:relative;z-index:1\}/);
 assert.match(css,/\.step-top,\.step-text\{position:relative;z-index:1\}/);
 assert.match(fade,/gradientTransform="matrix\(19\.012 17\.858 -19\.624 17\.183 -28\.866 -28\.355\)"/);
 assert.match(app,/className="step-grid" aria-hidden="true"/);
 assert.match(css,/\.step-divider\{[^}]*height:1px[^}]*background:var\(--border\)/);
 assert.match(css,/\.step-divider\{position:absolute;z-index:2;left:11px;right:11px;top:-1px;width:auto;height:1px;margin:0[^}]*background:transparent/);
 assert.match(css,/\.step-text h3\{[^}]*font:400 20px\/28px "Google Sans"[^}]*color:var\(--cv2-text-neutral-tertiary\)/);
 assert.match(css,/\.step-dots\{color:var\(--cv2-text-neutral-muted\)/);
 assert.match(css,/\.step-icon-base,\.step-icon-background,\.step-icon-fill\{display:none\}/);
 assert.match(css,/\.step-icon-desktop-base,\.step-icon-hover\{display:block/);
 assert.match(app,/className="step-icon-desktop-base" src=\{`\/figma\/\$\{step\.image\}-desktop\.svg`\}/);
});
