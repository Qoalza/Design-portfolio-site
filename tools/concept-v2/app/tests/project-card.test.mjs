import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..');

test('project card keeps one layer tree and maps both Figma states',async()=>{
  const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
  const css=await readFile(path.join(root,'src/style.css'),'utf8');
  assert.match(app,/project-back-layer/);
  assert.match(app,/project-front-layer/);
  assert.doesNotMatch(app,/project-hover-preview/);
  assert.match(css,/height:613px/);
  assert.match(css,/height:329px/);
  assert.match(css,/padding:24px 56px 48px/);
  assert.match(css,/transition:[^}]*150ms ease-in/);
  assert.match(css,/\.project:is\(:hover,:focus-within\)/);
});
