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

test('AI desktop panel is the static two-column 1280 by 283 Figma composition',async()=>{
 const app=await readFile(path.join(appRoot,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 assert.match(app,/className="ai-desktop-panel"/);
 assert.match(app,/className="ai-code-panel"/);
 assert.match(app,/className="ai-static-code"/);
 assert.doesNotMatch(app,/ai-code-action|className="ai-copy"|className="ai-view"/);
 assert.match(css,/\.ai-section\{[^}]*height:363px[^}]*padding-top:80px/);
 assert.match(css,/\.ai-desktop-panel\{[^}]*width:1280px[^}]*height:283px[^}]*grid-template-columns:640px 640px/);
 assert.match(css,/\.ai-desktop-copy\{[^}]*height:283px[^}]*border:1px solid var\(--cv2-border-neutral-thin\)/);
 assert.match(css,/\.ai-copy-content\{[^}]*padding:32px 40px/);
 assert.match(css,/\.ai-copy-banner\{[^}]*padding:24px 40px[^}]*border-top:1px solid var\(--cv2-border-neutral-thin\)/);
 assert.match(css,/\.ai-code-panel\{[^}]*border:1px solid var\(--cv2-border-neutral-thin\)[^}]*border-left:0/);
 assert.match(css,/\.ai-code-header\{[^}]*height:48px[^}]*padding:0 16px 0 32px/);
 assert.match(css,/\.ai-code-body\{[^}]*padding:24px 32px[^}]*background:var\(--page\)/);
 assert.match(css,/\.ai-code-body::after\{[^}]*height:142px/);
});

test('AI keeps the desktop hatches and leaves the existing mobile panel intact',async()=>{
 const app=await readFile(path.join(appRoot,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 const responsive=await readFile(path.join(appRoot,'src/responsive.css'),'utf8');
 const top=await readFile(path.join(appRoot,'public/figma/ai-hatch-top.svg'));
 assert.match(app,/className="ai-desktop-side"/);
 assert.match(app,/className="ai-mobile-panel"/);
 assert.equal(createHash('sha256').update(top).digest('hex'),'a279263ea3356ca6106b57e934608ec88349e1b693c6740c114447fbb2c94144');
 assert.match(css,/\.ai-desktop-side\{[^}]*background:repeating-linear-gradient\(126\.826deg,#1d2124 0 1px,transparent 1px 15px\)/);
 assert.match(responsive,/@media\(max-width:1279px\)\{[\s\S]*?\.ai-desktop-panel,\.ai-desktop-side\{display:none\}/);
 assert.match(responsive,/\.ai-mobile-panel\{display:block/);
});

test('AI static code panel retains source copy and has no active controls or clock',async()=>{
 const app=await readFile(path.join(appRoot,'src/App.jsx'),'utf8');
 assert.match(app,/contentClass=desktop\?'ai-copy-content':'ai-main'/);
 assert.match(app,/bannerClass=desktop\?'ai-copy-banner':'ai-banner'/);
 assert.match(app,/src="\/figma\/ai-codex-icon\.svg" width="28" height="28"/);
 assert.match(app,/Данный сайт был разработан с 0 в codex, а дизайн в Figma\. Без шаблонов\./);
 assert.match(app,/HTML \+ JavaScript/);
 assert.match(app,/className="code-tag"/);
 assert.match(app,/className="code-keyword"/);
 assert.doesNotMatch(app,/<time|setInterval\(/);
 assert.doesNotMatch(app,/ChatGPT|ai-other-chip|tools-list|className="tool"/);
 for(const asset of ['ai-hatch-top.svg','ai-codex-icon.svg'])await access(path.join(appRoot,'public/figma',asset));
});

test('footer retains its Figma spacing and uses current semantic color roles',async()=>{
 const app=await readFile(path.join(appRoot,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 assert.match(app,/<footer className="site-footer"><div className="site-footer-inner">/);
 assert.match(css,/\.site-footer\{[^}]*height:61px[^}]*background:var\(--cv2-container-neutral-faint\)[^}]*border-top:1px solid var\(--cv2-border-neutral-surface\)/);
 assert.match(css,/\.site-footer-inner\{[^}]*padding:20px 48px 24px[^}]*font:400 12px\/16px "Source Code Pro"[^}]*color:var\(--cv2-text-neutral-muted\)/);
});
