import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {exportApprovedRedesign} from '../tools/concept-v2/export-approved-content.mjs';
import {parseProjectDocument,serializeProjectDocument} from '../src/lib/project-contract.ts';
const repoRoot=fileURLToPath(new URL('..',import.meta.url));
let exported;
const get=async()=>exported??=await exportApprovedRedesign({repoRoot});

test('approved code export returns two complete validated v3 documents with source provenance',async()=>{
 const result=await get();assert.deepEqual(result.projects.map(p=>p.slug),['corvo','sarafan-radio']);
 for(const project of result.projects)assert.deepEqual(parseProjectDocument(serializeProjectDocument(project)),project);
 assert.equal(result.provenance.sourceSha,'258e95b2a7720499c7a74ec7602c8608b8c58200');
 assert.ok(result.provenance.files.length>100);assert.equal(result.provenance.origin,'approved-git-code');
});
test('Corvo preserves every paragraph/list/heading, both notices, metrics split and distinct material links',async()=>{
 const p=(await get()).projects[0];const page=p.redesign.page;
 assert.equal(p.materials.updatedAt,'13.05.2026');assert.equal(page.summary.length,1);assert.equal(page.metrics.items[0].copy.length,2);
 assert.equal(page.metrics.items[2].value,'1 056');assert.equal(page.metrics.items[3].value,'129');assert.equal(page.metrics.items[3].secondaryValue,'/ 262');
 assert.equal(new Set(page.metrics.items.map(m=>m.action.href)).size,4);
 assert.deepEqual(page.sections.map(s=>s.id),['context','scenarios','system','result']);
 assert.deepEqual(page.sections.map(s=>s.blocks.length),[3,4,7,4]);
 assert.equal(page.sections[2].blocks.at(-1).type,'notice');
 assert.equal(page.sections[3].blocks[1].items.length,4);
 assert.equal(page.showcase.description[0].text.startsWith('При создании медиакомпании'),true);
});
test('Sarafan retains 3+2+3+3+3 paragraphs and the Cyrillic card versus Latin page tag',async()=>{
 const p=(await get()).projects[1],page=p.redesign.page;
 assert.deepEqual([page.summary.length,page.flow.paragraphs.length,...page.sections.map(s=>s.paragraphs.length),page.result.paragraphs.length],[3,2,3,3,3]);
 assert.equal(p.tags[0],'B2B2С');assert.equal(p.detailTags[0],'B2B2C');assert.equal(p.redesign.card.tag,'Тестовое задание');
 assert.match(page.flow.action.href,/figma.com\/board/);assert.match(p.materials.figmaUrl,/figma.com\/design/);
 assert.deepEqual(p.redesign.hero.slides.map(s=>s.id),['delivery','home','variant']);assert.equal(p.redesign.hero.initialSlideId,'home');
});
test('exported assets have byte hashes, intrinsic image dimensions and retain prepared renditions',async()=>{
 const result=await get();
 for(const p of result.projects)for(const image of [p.redesign.card.preview.back,p.redesign.card.preview.front,p.redesign.page.showcase?.image??p.redesign.page.flow.image]){
  const asset=result.assets.find(a=>a.publicPath===image.src);assert.ok(asset);assert.equal(asset.sha256.length,64);
  assert.equal(asset.bytes.readUInt32BE(16),image.width);assert.equal(asset.bytes.readUInt32BE(20),image.height);
 }
 assert.equal(result.assets.filter(a=>a.publicPath.endsWith('.avif')).length,4);
});
test('layout package keeps all four scene entries byte-identical and reports its external font dependency',async()=>{
 const result=await get(),hero=result.projects[0].redesign.hero;
 assert.equal(hero.initialSceneId,'media-campaigns');assert.deepEqual(hero.adaptives.enabled,['mobile','tablet','desktop']);
 for(const scene of hero.scenes){
  const asset=result.assets.find(a=>a.publicPath===scene.source.assetBase+scene.source.entry);assert.ok(asset);
  const original=await readFile(path.join(repoRoot,'tools/concept-v2/app/public/responsive-scenes/corvo-v1',scene.source.entry));assert.deepEqual(asset.bytes,original);
  assert.equal(scene.adaptives[0].presetWidth,595.256245);assert.equal(scene.adaptives[1].presetWidth,1279);assert.equal(scene.adaptives[2].presetWidth,1599);
 }
 assert.ok(result.provenance.externalDependencies.includes('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap'));
});
test('export is deterministic and does not alter canonical files',async()=>{
 const before=await readFile(path.join(repoRoot,'content/projects/corvo.json'),'utf8');
 const result=await exportApprovedRedesign({repoRoot});assert.deepEqual(result.projects,(await get()).projects);
 assert.equal(await readFile(path.join(repoRoot,'content/projects/corvo.json'),'utf8'),before);
});

test('every local HTML/CSS package reference resolves to a declared file and external fonts are explicit',async()=>{
 const result=await get(),source=result.projects[0].redesign.hero.scenes[0].source;
 const prefix='https://approved.example'+source.assetBase;
 for(const file of source.files.filter(f=>['text/html','text/css'].includes(f.mime))){
  const bytes=result.assets.find(a=>a.publicPath===source.assetBase+file.path).bytes.toString('utf8');
  const matches=file.mime==='text/html'?[...bytes.matchAll(/(?:src|href)="([^"#]+)"/g)]:[...bytes.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)];
  for(const [,reference] of matches){if(reference.startsWith('https:')){assert.ok(result.provenance.externalDependencies.includes(reference));continue;}
   const url=new URL(reference,prefix+file.path);assert.ok(url.href.startsWith(prefix));assert.ok(source.files.some(f=>prefix+f.path===url.href),`${file.path} missing ${reference}`);
  }
 }
});

test('logos come from the approved new interface, including four radio vectors and three masks',async()=>{
 const result=await get();const corvo=result.projects[0],sarafan=result.projects[1];
 assert.equal(corvo.logo.src,'/assets/projects/corvo/redesign/imgProjectCorvo.svg');
 assert.equal(sarafan.logo.type,'layered');assert.deepEqual(sarafan.logo.layers.map(l=>l.slot),['a','b','c','d']);
 const sources=['imgProjectCorvo.svg',...['a','b','c','d'].map(l=>`radio-logo-vector-${l}.svg`),...['a','b','c'].map(l=>`radio-logo-mask-${l}.svg`)];
 for(const source of sources){const asset=result.assets.find(a=>a.sourcePath.endsWith('/'+source));assert.ok(asset);assert.deepEqual(asset.bytes,await readFile(path.join(repoRoot,'tools/concept-v2/app/public/figma',source)));}
});

test('all recorded visible approved literals have data owners apart from fixed shared UI',async()=>{
 const result=await get();
 const inventory=JSON.parse(await readFile(new URL('fixtures/redesign-approved-copy.json',import.meta.url),'utf8'));
 assert.equal(inventory.sourceSha,result.provenance.sourceSha);
 const strings=value=>typeof value==='string'?[value]:value&&typeof value==='object'?Object.values(value).flatMap(strings):[];
 const values=strings(result.projects),fixed=['/','Разработка и Дизайн Артур А.','2026'];
 for(const source of inventory.sources.slice(0,2))for(const literal of source.literals.filter(l=>l.kind==='jsxText'&&!fixed.includes(l.value)))assert.ok(values.includes(literal.value),`${source.file}:${literal.line} missing ${literal.value}`);
});
