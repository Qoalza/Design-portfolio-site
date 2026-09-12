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
  assert.match(tokens,/--v2-fill-accent-bg-enable:#0378d6/);
  assert.match(controls,/export function V2Button/);
  assert.doesNotMatch(controls,/className={`control /);
});
