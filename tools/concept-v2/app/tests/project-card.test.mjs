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
  assert.match(css,/height:592px/);
  assert.match(css,/height:260px/);
  assert.match(css,/height:332px/);
  assert.match(css,/padding:24px 40px 40px/);
  assert.match(css,/\.project-categories\{[^}]*gap:12px/);
  assert.match(css,/\.project-content\{[^}]*height:212px/);
  assert.match(css,/\.project-tag\{[^}]*background:#ffc31f/);
  assert.match(css,/\.projects-section\{height:auto;min-height:1216px;padding:120px 0 80px;gap:80px;overflow:visible\}/);
  assert.match(css,/\.projects-grid\{height:800px;align-items:end;gap:16px;background:transparent;overflow:visible\}/);
  assert.doesNotMatch(css,/\.projects-grid::after\{/);
  assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.body-container\{border-inline:0\}/);
  assert.match(css,/\.project,\.project-preview\{overflow:visible\}/);
  assert.match(css,/\.project-main\{overflow:hidden\}/);
  assert.match(css,/\.project-glow\{z-index:0\}/);
  assert.match(css,/\.project\{background:transparent\}/);
  assert.match(css,/\.project-divider\{position:absolute;z-index:6;inset:0 0 auto;height:1px;background:var\(--border\)/);
  assert.match(css,/\.project-divider\{z-index:1;left:12px;right:12px;top:0;bottom:auto;height:1px;background:transparent\}/);
  assert.match(css,/\.project-divider::after\{[^}]*opacity:0[^}]*scaleX\(\.0162866\)[^}]*transform-origin:center/);
  assert.match(css,/\.project:hover \.project-divider::after,\.project:focus-within \.project-divider::after\{opacity:1;transform:scaleX\(1\)\}/);
  assert.match(css,/\.project-back-layer\{z-index:2\}/);
  assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.project-back-layer\{left:calc\(50% \+ 79\.05px\);bottom:43\.27px\}/);
  assert.match(css,/\.project-shade\{z-index:3;left:50%;top:1px;width:638px;height:328px/);
  assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.project-shade\{inset:0 0 -1px 0;width:auto;height:auto;transform:none;border-radius:11px 11px 0 0;background:url\('\/figma\/project-shade-preview\.svg'\) center\/100% 100% no-repeat\}/);
  assert.match(css,/\.project-front-layer\{z-index:4\}/);
  assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.project-front-layer\{left:calc\(50% - 19\.5px\);bottom:19\.9px\}/);
  assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.project-glow\{[^}]*border-radius:11px 11px 0 0[^}]*rgba\(45,95,135,\.6\)[^}]*rgba\(35,62,83,\.8\)[^}]*rgba\(29,45,57,\.9\)[^}]*#181c1f 69\.36%/);
  assert.match(css,/\.project:hover \.project-back-layer,\.project:focus-within \.project-back-layer\{left:calc\(50% \+ 79\.96px\);bottom:87\.15px/);
  assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.project:hover \.project-back-layer,\.project:focus-within \.project-back-layer\{left:calc\(50% \+ 80\.21px\);bottom:87\.15px/);
  assert.doesNotMatch(css,/\.project-shade\{[^}]*height:417px/);
  assert.match(css,/\.project-preview\{[^}]*border:1px solid var\(--cv2-border-neutral-thin\)[^}]*border-radius:12px 12px 0 0/);
  assert.match(css,/\.project:hover \.project-preview,\.project:focus-within \.project-preview\{border-bottom-color:transparent\}/);
  assert.match(css,/\.project-main\{[^}]*border:1px solid var\(--cv2-border-neutral-thin\)[^}]*border-top:0[^}]*border-radius:0 0 12px 12px[^}]*background:var\(--surface\)/);
  assert.match(responsive,/@media\(max-width:1279px\)[\s\S]*?\.project\{[^}]*height:auto/);
  assert.match(responsive,/@media\(max-width:1279px\)[\s\S]*?\.project-main\{[^}]*height:auto;min-height:284px/);
  assert.match(css,/transition:[^}]*150ms ease-in/);
  assert.match(css,/\.project:hover \.project-front-layer/);
  assert.doesNotMatch(css,/\.projects-section\[data-scroll-active\]/);
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
 assert.equal((app.match(/aria-disabled="true" data-cursor="hand"/g)||[]).length,2);
 assert.doesNotMatch(app,/href="https:\/\/art-des\.ru\/projects\/sarafan/);
 assert.match(app,/radio-logo-vector-\$\{layer\}\.svg/);
 assert.match(css,/\.project-actions-static \.control\{cursor:pointer\}/);
});

test('Projects publication note follows the user-approved homepage copy',async()=>{
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 assert.match(app,/<p className="projects-status">\/\/ остальные проекты в процессе публикации<\/p>/);
 assert.doesNotMatch(app,/className="projects-all-action"/);
 assert.match(css,/\.projects-status\{[^}]*"Source Code Pro"/);
 assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.projects-heading>\.projects-status\{[^}]*color:var\(--cv2-text-neutral-thin\)/);
 assert.match(css,/@media\(min-width:1280px\)\{[\s\S]*?\.process-heading>\.tech-note\{[^}]*color:var\(--cv2-text-neutral-thin\)/);
 const shade=await readFile(path.join(root,'public/figma/project-shade-preview.svg'),'utf8');
 assert.match(shade,/stop-color="#181C1F"/);
 assert.doesNotMatch(shade,/stop-color="#1D1E1F"/);
});

test('project previews use verified image sources and retain the PNG fallback',async()=>{
 const {projectBackImage,projectFrontImage,sarafanBackImage,sarafanFrontImage}=await import('../src/media/image-sources.mjs');
 for(const source of [projectBackImage,projectFrontImage]){
  assert.match(source.fallback,/\.png$/);
  assert.deepEqual(source.sources,[{type:'image/avif',srcSet:source.fallback.replace(/\.png$/,'-640.avif')+' 640w, '+source.fallback.replace(/\.png$/,'-1080.avif')+' 1080w'}]);
  for(const candidate of source.sources){
   for(const entry of candidate.srcSet.split(', '))await access(path.join(root,'public',entry.split(' ')[0]));
  }
 }
 for(const source of [sarafanBackImage,sarafanFrontImage]){
  assert.match(source.fallback,/sarafan-desktop-[34]\.png$/);
  assert.deepEqual(source.sources,[]);
  await access(path.join(root,'public',source.fallback));
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
