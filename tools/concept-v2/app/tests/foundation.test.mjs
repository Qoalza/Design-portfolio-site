import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const appRoot=path.resolve(import.meta.dirname,'..');
const conceptRoot=path.resolve(appRoot,'..');
const repositoryRoot=path.resolve(conceptRoot,'../..');

test('standalone stack remains pinned to the approved versions',async()=>{
  const packageJson=JSON.parse(await readFile(path.join(appRoot,'package.json'),'utf8'));
  assert.deepEqual(packageJson.dependencies,{'@vitejs/plugin-react':'5.0.4',vite:'6.4.2',react:'19.2.0','react-dom':'19.2.0'});
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

test('AI desktop panel retains its source 272px height and 577px left column',async()=>{
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 assert.match(css,/\.ai-panel\{[^}]*min-height:272px[^}]*grid-template-columns:577px minmax\(0,1fr\)/);
 assert.match(css,/\.ai-panel>\.section-title\{padding:40px 56px/);
 assert.match(css,/\.ai-panel \.ai-tools\{[^}]*padding:40px 56px/);
});

test('AI other-tools chip is a static semantic text element with current source styling',async()=>{
 const app=await readFile(path.join(appRoot,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 assert.match(app,/<span className="ai-other-chip">и множество других<\/span>/);
 assert.doesNotMatch(app,/ai-other-chip[^>]*(?:onClick|tabIndex|href)/);
 assert.match(css,/\.ai-other-chip\{[^}]*padding:8px 12px[^}]*border-radius:8px[^}]*font:400 16px\/20px "Source Code Pro"/);
});

test('footer retains its Figma spacing and uses current semantic color roles',async()=>{
 const app=await readFile(path.join(appRoot,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(appRoot,'src/style.css'),'utf8');
 assert.match(app,/<footer className="site-footer"><div className="site-footer-inner">/);
 assert.match(css,/\.site-footer\{[^}]*height:61px[^}]*background:var\(--cv2-container-neutral-faint\)[^}]*border-top:1px solid var\(--cv2-border-neutral-surface\)/);
 assert.match(css,/\.site-footer-inner\{[^}]*padding:20px 48px 24px[^}]*font:400 12px\/16px "Source Code Pro"[^}]*color:var\(--cv2-text-neutral-muted\)/);
});
