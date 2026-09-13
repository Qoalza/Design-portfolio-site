import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..');

test('project card keeps one layer tree and maps both Figma states',async()=>{
  const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
  const css=await readFile(path.join(root,'src/style.css'),'utf8');
  const responsive=await readFile(path.join(root,'src/responsive.css'),'utf8');
  assert.match(app,/project-back-layer/);
  assert.match(app,/project-front-layer/);
  assert.doesNotMatch(app,/project-hover-preview/);
  assert.match(css,/height:613px/);
  assert.match(css,/height:329px/);
  assert.match(css,/padding:24px 56px 48px/);
  assert.match(css,/\.projects-section\{height:auto;min-height:1125px;padding:120px 0 80px;gap:80px;overflow:visible\}/);
  assert.match(css,/\.projects-grid\{height:709px;padding-top:96px;background:transparent;overflow:visible\}/);
  assert.match(css,/\.project,\.project-preview\{overflow:visible\}/);
  assert.match(css,/\.project-main\{overflow:hidden\}/);
  assert.match(css,/\.project-glow\{z-index:0\}/);
  assert.match(css,/\.project-divider\{z-index:1\}/);
  assert.match(css,/\.project-back-layer\{z-index:2\}/);
  assert.match(css,/\.project-shade\{z-index:3;width:473px;height:417px;right:31\.5px;top:33px;[^}]*background:url\('\/figma\/project-shade\.svg'\) center\/100% 100% no-repeat/);
  assert.match(css,/\.project-front-layer\{z-index:4\}/);
  assert.match(responsive,/@media\(max-width:1279px\)[\s\S]*?\.project\{[^}]*height:auto/);
  assert.match(responsive,/@media\(max-width:1279px\)[\s\S]*?\.project-main\{[^}]*height:auto;min-height:284px/);
  assert.match(css,/transition:[^}]*150ms ease-in/);
  assert.match(css,/\.project:is\(:hover,:focus-within\)/);
});
