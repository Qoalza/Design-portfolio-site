import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..');

test('project card keeps one layer tree and maps both Figma states',async()=>{
  const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
  const picture=await readFile(path.join(root,'src/media/ResponsivePicture.jsx'),'utf8');
  const css=await readFile(path.join(root,'src/style.css'),'utf8');
  const responsive=await readFile(path.join(root,'src/responsive.css'),'utf8');
  assert.match(app,/project-back-layer/);
  assert.match(app,/project-front-layer/);
  assert.doesNotMatch(app,/project-(?:back|front)-shadow/);
  assert.match(app,/ResponsivePicture source=\{projectBackImage\}/);
  assert.match(app,/ResponsivePicture source=\{projectFrontImage\}/);
  assert.match(app,/ResponsivePicture source=\{projectBackImage\}[^>]*sizes="520px"/);
  assert.match(app,/ResponsivePicture source=\{projectFrontImage\}[^>]*sizes="520px"/);
  assert.match(picture,/if\(!sources\.length\)return <img \{\.\.\.imageProps\}\/>/);
  assert.doesNotMatch(app,/project-hover-preview/);
  assert.match(css,/height:613px/);
  assert.match(css,/height:329px/);
  assert.match(css,/padding:24px 56px 48px/);
  assert.match(css,/\.projects-section\{height:auto;min-height:1125px;padding:120px 0 80px;gap:80px;overflow:visible\}/);
  assert.match(css,/\.projects-grid\{height:709px;padding-top:96px;background:transparent;overflow:visible\}/);
  assert.match(css,/\.projects-grid\{[^}]*position:relative/);
  assert.match(css,/\.projects-grid::after\{[^}]*left:50%;[^}]*width:1px;[^}]*background:var\(--border\);[^}]*z-index:8/);
  assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.projects-grid::after\{top:96px\}/);
  assert.match(responsive,/@media\(max-width:899px\)\{[\s\S]*?\.projects-grid::after\{display:none\}/);
  assert.match(css,/\.project,\.project-preview\{overflow:visible\}/);
  assert.match(css,/\.project-main\{overflow:hidden\}/);
  assert.match(css,/\.project-glow\{z-index:0\}/);
  assert.match(css,/\.project-divider\{z-index:1\}/);
  assert.match(css,/\.project-back-layer\{z-index:2\}/);
  assert.match(css,/\.project-shade\{z-index:3;left:50%;top:1px;width:638px;height:328px;[^}]*transform:translateX\(-50%\);[^}]*background:url\('\/figma\/project-shade-preview\.svg'\) center\/100% 100% no-repeat/);
  assert.doesNotMatch(css,/\.project-shade\{[^}]*height:417px/);
  assert.match(css,/\.project-front-layer\{z-index:4\}/);
  assert.match(responsive,/@media\(max-width:1279px\)[\s\S]*?\.project\{[^}]*height:auto/);
  assert.match(responsive,/@media\(max-width:1279px\)[\s\S]*?\.project-main\{[^}]*height:auto;min-height:284px/);
  assert.match(css,/transition:[^}]*150ms ease-in/);
  assert.match(css,/html:not\(\[data-scroll-active\]\) \.project:hover/);
  assert.match(css,/html\[data-scroll-active\] \.project:hover [^{]+\{transition:none\}/);
  assert.match(css,/\.project-back\{[^}]*box-shadow:0 4px 50px -10px rgba\(163,213,253,.5\)/);
  assert.match(css,/\.project-front\{[^}]*box-shadow:0 4px 100px -20px rgba\(29,30,31,.4\)/);
  assert.match(css,/\.project-back,\.project-front,\.project p\{transition:none\}/);
});

test('Projects action uses the source label, exact Medium chevron, and fixed 218px frame',async()=>{
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 assert.match(app,/className="projects-all-action"[^>]*iconRight="imgColor6">Посмотреть все проекты/);
 assert.match(css,/\.projects-all-action\{width:218px/);
});

test('project previews select Retina-safe AVIF sources and retain the PNG fallback',async()=>{
 const {projectBackImage,projectFrontImage}=await import('../src/media/image-sources.mjs');
 for(const source of [projectBackImage,projectFrontImage]){
  assert.match(source.fallback,/\.png$/);
  assert.deepEqual(source.sources,[{type:'image/avif',srcSet:source.fallback.replace(/\.png$/,'-640.avif')+' 640w, '+source.fallback.replace(/\.png$/,'-1080.avif')+' 1080w'}]);
  for(const candidate of source.sources){
   for(const entry of candidate.srcSet.split(', '))await access(path.join(root,'public',entry.split(' ')[0]));
  }
 }
});
