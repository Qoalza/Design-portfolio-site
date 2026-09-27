import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..');

test('project cards map the current Figma configurations and states',async()=>{
  const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
  const picture=await readFile(path.join(root,'src/media/ResponsivePicture.jsx'),'utf8');
  const css=await readFile(path.join(root,'src/style.css'),'utf8');
  const responsive=await readFile(path.join(root,'src/responsive.css'),'utf8');
  assert.match(app,/project-back-layer/);
  assert.match(app,/project-front-layer/);
  assert.doesNotMatch(app,/project-(?:back|front)-shadow/);
  assert.match(app,/ResponsivePicture source=\{project\.preview\.back\}/);
  assert.match(app,/ResponsivePicture source=\{project\.preview\.front\}/);
  assert.match(app,/ResponsivePicture source=\{project\.preview\.back\}[^>]*sizes="520px"/);
  assert.match(app,/ResponsivePicture source=\{project\.preview\.front\}[^>]*sizes="520px"/);
  assert.match(picture,/if\(!sources\.length\)return <img \{\.\.\.imageProps\}\/>/);
  assert.doesNotMatch(app,/project-hover-preview/);
  assert.match(css,/height:661px/);
  assert.match(css,/height:329px/);
  assert.match(css,/height:332px/);
  assert.match(css,/padding:24px 56px 48px/);
  assert.match(css,/\.project-categories\{[^}]*gap:12px/);
  assert.match(css,/\.project-content\{[^}]*height:212px/);
  assert.match(css,/\.project-tag\{[^}]*background:#ffc31f/);
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
  assert.match(css,/\.project-shade\{z-index:3;left:50%;top:1px;width:638px;height:328px;[^}]*transform:translateX\(-50%\);[^}]*background:radial-gradient\(ellipse 46\.227% 89\.917% at 88\.636% \.762%,rgba\(24,28,31,0\) 10\.3446%,#181c1f 97\.2643%\)/);
  assert.match(css,/\.project-glow\{[^}]*#181c1f 69\.36%/);
  assert.doesNotMatch(css,/\.project-shade\{[^}]*height:417px/);
  assert.match(css,/\.project-front-layer\{z-index:4\}/);
  assert.match(responsive,/@media\(max-width:1279px\)[\s\S]*?\.project\{[^}]*height:auto/);
  assert.match(responsive,/@media\(max-width:1279px\)[\s\S]*?\.project-main\{[^}]*height:auto;min-height:284px/);
  assert.match(css,/transition:[^}]*150ms ease-in/);
  assert.match(css,/\.projects-section:not\(\[data-scroll-active\]\) \.project:hover/);
  assert.match(css,/\.projects-section\[data-scroll-active\] \.project:hover [^{]+\{transition:none\}/);
  assert.match(css,/\.project-back\{[^}]*box-shadow:0 4px 50px -10px rgba\(163,213,253,.5\)/);
  assert.match(css,/\.project-front\{[^}]*box-shadow:0 4px 100px -20px rgba\(29,30,31,.4\)/);
  assert.match(css,/\.project-back,\.project-front,\.project p\{transition:none\}/);
});

test('Projects render distinct Corvo and Sarafan.Radio Figma content without invented links',async()=>{
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 assert.match(app,/id:'corvo'/);
 assert.match(app,/id:'sarafan-radio'/);
 assert.match(app,/title:'Сараффан\.Радио'/);
 assert.match(app,/categories:\['B2B2С','EVENT'\]/);
 assert.match(app,/Тестовое задание/);
 assert.match(app,/project-actions-static/);
 assert.doesNotMatch(app,/href="https:\/\/art-des\.ru\/projects\/sarafan/);
 assert.match(app,/radio-logo-vector-\$\{layer\}\.svg/);
 assert.match(css,/\.project-actions-static\{cursor:default\}/);
});

test('Projects publication note follows the user-approved homepage copy',async()=>{
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 assert.match(app,/<p className="projects-status">\/\/ остальные проекты в процессе публикации<\/p>/);
 assert.doesNotMatch(app,/className="projects-all-action"/);
 assert.match(css,/\.projects-status\{[^}]*"Source Code Pro"/);
 const shade=await readFile(path.join(root,'public/figma/project-shade-preview.svg'),'utf8');
 assert.match(shade,/stop-color="#181C1F"/);
 assert.doesNotMatch(shade,/stop-color="#1D1E1F"/);
});

test('project previews select Retina-safe AVIF sources and retain the PNG fallback',async()=>{
 const {projectBackImage,projectFrontImage,sarafanBackImage,sarafanFrontImage}=await import('../src/media/image-sources.mjs');
 for(const source of [projectBackImage,projectFrontImage,sarafanBackImage,sarafanFrontImage]){
  assert.match(source.fallback,/\.png$/);
  assert.deepEqual(source.sources,[{type:'image/avif',srcSet:source.fallback.replace(/\.png$/,'-640.avif')+' 640w, '+source.fallback.replace(/\.png$/,'-1080.avif')+' 1080w'}]);
  for(const candidate of source.sources){
   for(const entry of candidate.srcSet.split(', '))await access(path.join(root,'public',entry.split(' ')[0]));
  }
 }
});

test('project AVIF derivatives omit metadata boxes rejected by Zen',async()=>{
 for(const name of ['imgDesktop3-640.avif','imgDesktop3-1080.avif','imgDesktop4-640.avif','imgDesktop4-1080.avif','sarafan-desktop-3-640.avif','sarafan-desktop-3-1080.avif','sarafan-desktop-4-640.avif','sarafan-desktop-4-1080.avif']){
  const asset=await readFile(path.join(root,'public/figma',name));
  assert.equal(asset.includes(Buffer.from('clap')),false,`${name} contains clap`);
  assert.equal(asset.includes(Buffer.from('clli')),false,`${name} contains clli`);
 }
});

test('project images are promoted and decoded before the section enters the viewport',async()=>{
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 assert.match(app,/import \{createImagePreparer\} from '\.\/media\/image-preparation\.mjs'/);
 assert.match(app,/function Projects\(\)/);
 assert.match(app,/new IntersectionObserver\(/);
 assert.match(app,/\{rootMargin:'150% 0px',threshold:0\}\);/);
 assert.match(app,/preparer\.prepareAll\(imageNodes\.current,'high'\)/);
 assert.match(app,/ResponsivePicture source=\{project\.preview\.back\}[^>]*imageRef|ResponsivePicture source=\{project\.preview\.back\}[^>]*ref=\{imageRef\}/);
 assert.match(app,/ResponsivePicture source=\{project\.preview\.front\}[^>]*imageRef|ResponsivePicture source=\{project\.preview\.front\}[^>]*ref=\{imageRef\}/);
});
