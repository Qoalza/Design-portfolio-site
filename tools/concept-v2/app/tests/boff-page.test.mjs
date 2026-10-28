import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {boffForPath,boffProject,boffHero,approvedBoffCaptions} from '../src/project-page/boff-content.mjs';
import {resolveRasterSelection} from '../src/project-hero/raster-selection.mjs';
import {desktopRasterSlides} from '../src/project-hero/raster-desktop-presentation.mjs';

test('B.Off local route is exact and does not claim other project routes',()=>{
 assert.equal(boffForPath('/projects/boff'),boffProject);
 for(const path of ['/projects/corvo','/projects/sarafan-radio','/projects/boff-other','/'])assert.equal(boffForPath(path),undefined);
 assert.equal(boffProject.year,2025);
});
test('five distinct B.Off screens start at Account and retain Figma neighbours',()=>{
 const context=boffHero.contexts[0];
 assert.equal(context.slides.length,5);
 assert.equal(new Set(context.slides.map(slide=>slide.src)).size,5);
 const selection=resolveRasterSelection(boffHero);
 assert.equal(selection.slideId,'account');
 const active=context.slides.findIndex(slide=>slide.id===selection.slideId);
 assert.deepEqual([-2,-1,0,1,2].map(offset=>context.slides[(active+offset+5)%5].id),['access-control','transactions','account','invoices','api-access']);
 assert.deepEqual(boffHero.contexts.slice(1).map(context=>context.slides),[[],[]]);
});
test('captions follow stable image IDs and approved copy is mapped by image',()=>{
 const slides=desktopRasterSlides(boffHero,boffHero.contexts[0]);
 assert.equal(slides.find(slide=>slide.id==='account').description,'Сводка балансов кастодиальных кошельков');
 assert.deepEqual(Object.keys(approvedBoffCaptions).sort(),['access-control','api-access','invoices','transactions']);
 for(const slide of slides)assert.ok(slide.title&&slide.description);
});
test('all hero images resolve to non-empty portfolio-local files',async()=>{
 for(const slide of boffHero.contexts[0].slides){
  assert.match(slide.src,/^\/figma\/project-boff\//);
  assert.ok((await stat(new URL('../public'+slide.src,import.meta.url))).size>0);
 }
});

test('approved Lottie copies retain their source bytes and timing',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {createHash}=await import('node:crypto');
 const approved=[
  ['side-panels','5baca43f4afc0b8d90ad66bf639f4fdfec2952be01031f743adff829b59e2db3',241],
  ['technical-panel-details','2aa59cd9c62dd4138bf65c9c1f9f90e51099ff94a2bb023e5149ba617f2ae7c3',241],
  ['payout-history','6c87359889fde4935bee1d0df93c64bb99ee0610c04823f9218c42ce066196ee',240],
  ['api-setup','edd92dc2b03d43ba1a665b62b2afd7e83edccacf97eeb60b9ee6493ee2e9d60a',420],
 ];
 assert.deepEqual(boffProject.decisions.items.map(item=>item.id),approved.map(([id])=>id));
 for(const [id,sha,frames] of approved){
  const bytes=await readFile(new URL(`../public/figma/project-boff/lottie/${id}.json`,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
  const data=JSON.parse(bytes);assert.equal(data.op-data.ip,frames);assert.equal(data.fr,60);
  assert.equal(data.w,244);assert.equal(data.h,144);
 }
});
