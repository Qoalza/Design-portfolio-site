import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access,readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const appRoot=path.resolve(import.meta.dirname,'..');
const conceptRoot=path.resolve(appRoot,'..');
const repositoryRoot=path.resolve(conceptRoot,'../..');

test('standalone stack remains pinned to the approved versions',async()=>{
  const packageJson=JSON.parse(await readFile(path.join(appRoot,'package.json'),'utf8'));
  assert.deepEqual(packageJson.dependencies,{'@vitejs/plugin-react':'5.0.4',vite:'6.4.2',react:'19.2.0','react-dom':'19.2.0',motion:'13.4.2'});
  assert.equal(packageJson.scripts.dev,'vite');
  assert.equal(packageJson.scripts.build,'vite build');
  assert.match(packageJson.scripts.test,/node --test/);
  assert.match(packageJson.scripts.lint,/tests\/lint\.mjs/);
});

test('published source archive stays byte-identical',async()=>{
  const archive=await readFile(path.join(conceptRoot,'source.tar.gz'));
  assert.equal(createHash('sha256').update(archive).digest('hex'),'d3a2dc3d984c5c78289992853361616056dd5d9afa0f3dbf17572f0375476caf');
});

test('tracked standalone app stays outside the public Next.js runtime',async()=>{
  const main=await readFile(path.join(appRoot,'src/main.jsx'),'utf8');
  const nextConfig=await readFile(path.join(repositoryRoot,'next.config.ts'),'utf8');
  assert.match(main,/createRoot/);
  assert.doesNotMatch(main,/next\//);
  assert.match(nextConfig,/source: "\/concept-v2", destination: "\/concept-v2\/index\.html"/);
});

test('Library V2 foundation is isolated under its own namespace',async()=>{
  const tokens=await readFile(path.join(appRoot,'src/v2/tokens.css'),'utf8');
  const controls=await readFile(path.join(appRoot,'src/v2/Controls.jsx'),'utf8');
  assert.match(tokens,/--v2-fill-accent-bg-enable:var\(--cv2-container-accent-tertiary\)/);
  assert.match(controls,/export function V2Button/);
  assert.doesNotMatch(controls,/className={`control /);
});

test('AI desktop panel is the current 1280 by 335 Figma strip',async()=>{
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 assert.match(css,/\.ai-section\{[^}]*height:335px/);
 assert.match(css,/\.ai-panel\{[^}]*width:min\(1280px,100%\)[^}]*height:335px/);
 assert.match(css,/\.ai-main\{[^}]*height:241px[^}]*padding:40px 56px[^}]*gap:20px/);
 assert.match(css,/\.ai-banner\{[^}]*height:94px[^}]*padding:32px 56px[^}]*border:1px solid #0462af[^}]*background:rgba\(3,120,214,\.35\)/);
 assert.match(css,/\.ai-banner img\{[^}]*width:28px[^}]*height:28px/);
});

test('AI side fields use the exact exported Figma hatch frames',async()=>{
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 for(const [name,width,height] of [['top',147,241],['bottom',147,94]]){
  const file=await readFile(path.join(appRoot,`public/figma/ai-hatch-${name}-frame.png`));
  assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(file.readUInt32BE(16),width);
  assert.equal(file.readUInt32BE(20),height);
  assert.match(css,new RegExp(`background-image:url\\('/figma/ai-hatch-${name}-frame\\.png'\\)`));
 }
 assert.match(css,/\.ai-side-right::before,\.ai-side-right::after\{background-position:left top\}/);
 assert.match(css,/\.ai-side::before\{[^}]*border-top:1px solid var\(--cv2-border-neutral-surface\)/);
 assert.match(css,/\.ai-side::after\{[^}]*border-top:1px solid #0462af/);
});

test('AI strip removes the former tools list and retains exact source copy and assets',async()=>{
 const app=await readFile(path.join(appRoot,'src/App.jsx'),'utf8');
 const responsive=await readFile(path.join(appRoot,'src/responsive.css'),'utf8');
 assert.match(app,/className="ai-main"/);
 assert.match(app,/className="ai-banner"/);
 assert.match(app,/src="\/figma\/ai-codex-icon\.svg" width="28" height="28"/);
 assert.match(app,/Данный сайт был разработан с 0 в codex, а дизайн в Figma\. Без шаблонов\./);
 assert.doesNotMatch(app,/ChatGPT|ai-other-chip|tools-list|className="tool"/);
 assert.doesNotMatch(responsive,/ai-tools|tools-list|\.tool(?:\{|\s)/);
 for(const asset of ['ai-hatch-top.svg','ai-hatch-bottom.svg','ai-codex-icon.svg'])await access(path.join(appRoot,'public/figma',asset));
});

test('footer retains its Figma spacing and uses current semantic color roles',async()=>{
 const app=await readFile(path.join(appRoot,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 assert.match(app,/<footer className="site-footer"><div className="site-footer-inner">/);
 assert.match(css,/\.site-footer\{[^}]*height:61px[^}]*background:var\(--cv2-container-neutral-faint\)[^}]*border-top:1px solid var\(--cv2-border-neutral-surface\)/);
 assert.match(css,/\.site-footer-inner\{[^}]*padding:20px 48px 24px[^}]*font:400 12px\/16px "Source Code Pro"[^}]*color:var\(--cv2-text-neutral-muted\)/);
});
