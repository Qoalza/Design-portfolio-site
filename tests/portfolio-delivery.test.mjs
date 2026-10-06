import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { createDeliveryGeneration, validateDeliveryGeneration, DELIVERY_CAPABILITIES, contentHash } from '../tools/portfolio-delivery/contract.mjs';
import { scopedAssetPath, canonicalAssetPath, renderedProjects, scopedProjectImageSource } from '../tools/portfolio-delivery/asset-resolution.mjs';
import { createGenerationReader } from '../tools/portfolio-delivery/reader.mjs';
import { fixture, layoutFixture } from './fixtures/portfolio-delivery.mjs';
const renderer={rendererId:'a'.repeat(64),contractVersion:'public-delivery-v1',capabilities:DELIVERY_CAPABILITIES};
const make=()=>createDeliveryGeneration(fixture(),renderer);
test('delivery is deterministic and roundtrips without private editor data',()=>{
 const source=fixture(),generation=make();
 assert.deepEqual(validateDeliveryGeneration(JSON.parse(JSON.stringify(generation)),renderer),generation);
 assert.equal(createDeliveryGeneration({...source,projects:[...source.projects].reverse(),assets:[...source.assets].reverse()},renderer).contentId,generation.contentId);
 assert.equal(generation.projects.length,2);
 assert.equal(JSON.stringify(generation).includes('PRIVATE_FIXTURE'),false);
 const changed=fixture();changed.projects[0].title='Changed';
 assert.notEqual(createDeliveryGeneration(changed,renderer).contentId,generation.contentId);
});
test('empty generation and no-detail projects are valid',()=>{
 assert.equal(createDeliveryGeneration({projects:[],assets:[],externalDependencies:[]},renderer).projects.length,0);
 const source=fixture();source.projects[0].detailAvailable=false;
 assert.equal(createDeliveryGeneration(source,renderer).projects[0].detailAvailable,false);
});
test('strict contract, closure, bytes, MIME and compatibility reject invalid publication',()=>{
 const mutations=[s=>s.projects.push(s.projects[0]),s=>s.projects[0].privateToken='PRIVATE_FIXTURE',s=>s.projects[0].redesign.hero.kind='future',s=>s.projects[0].visibility='draft',s=>s.assets.pop(),s=>s.assets[0].bytes=Buffer.from('corrupt'),s=>s.assets[0].mime='text/html',s=>s.assets[0].publicPath='/assets/projects/fixture-one/../private',s=>s.assets.push(s.assets[0])];
 for(const mutate of mutations){const source=fixture();mutate(source);assert.throws(()=>createDeliveryGeneration(source,renderer));}
 const generation=make();generation.contentId='0'.repeat(64);assert.throws(()=>validateDeliveryGeneration(generation,renderer),/digest/i);
 assert.throws(()=>createDeliveryGeneration(fixture(),{...renderer,capabilities:[]}),/capabilit/i);
 assert.throws(()=>validateDeliveryGeneration(make(),{...renderer,contractVersion:'future'}),/contract/i);
});
test('scoped presentation mapping preserves canonical documents and prepared renditions',()=>{
 const generation=make(),project=generation.projects[0],src=project.redesign.card.preview.front.src;
 const scoped=scopedAssetPath(generation,src);
 assert.equal(canonicalAssetPath(generation,scoped),src);
 assert.equal(renderedProjects(generation)[0].redesign.card.preview.front.src,scoped);
 assert.equal(project.redesign.card.preview.front.src,src);
 const image=scopedProjectImageSource(generation,project.redesign.card.preview.front);
 assert.equal(image.fallback,scoped);assert.equal(image.sources[0].srcSet.split(',').length,2);
 assert.throws(()=>canonicalAssetPath(generation,scoped.replace(generation.contentId,'0'.repeat(64))));
 assert.throws(()=>scopedAssetPath(generation,'/assets/projects/fixture-one/private.svg'));
});
async function store(root,generation,source){
 const dir=path.join(root,'generations',generation.contentId);await mkdir(dir,{recursive:true});
 for(const asset of source.assets){const file=path.join(dir,asset.publicPath.slice(1));await mkdir(path.dirname(file),{recursive:true});await writeFile(file,asset.bytes);}
 await writeFile(path.join(dir,'generation.json'),JSON.stringify(generation));
 await writeFile(path.join(root,'active.json'),JSON.stringify({contractVersion:generation.contractVersion,contentId:generation.contentId,rendererId:renderer.rendererId,activationSeq:1}));
 return dir;
}
test('public reader validates files and retains last-good without treating corruption as empty',async()=>{
 const root=await mkdtemp('/private/tmp/portfolio-delivery-');
 try{
  const source=fixture(),generation=make();await store(root,generation,source);
  const reader=createGenerationReader({root,renderer}),active=await reader.readActive();
  assert.equal(active.generation.contentId,generation.contentId);
  assert.deepEqual(await active.readAsset(source.assets[0].publicPath),source.assets[0].bytes);
  await writeFile(path.join(root,'active.json'),'corrupt');
  assert.equal((await reader.readActive()).generation.contentId,generation.contentId);
  await assert.rejects(createGenerationReader({root,renderer}).readActive());
 }finally{await rm(root,{recursive:true,force:true});}
});
test('cold reader rejects corrupt bytes and symlink components, including manifest',async()=>{
 for(const mode of ['bytes','manifest','directory']){
  const root=await mkdtemp('/private/tmp/portfolio-delivery-');
  try{
   const source=fixture(),generation=make(),dir=await store(root,generation,source);
   const file=mode==='manifest'?path.join(dir,'generation.json'):path.join(dir,source.assets[0].publicPath.slice(1));
   if(mode==='bytes')await writeFile(file,'corrupt');
   else if(mode==='manifest'){const target=path.join(root,'secret');await writeFile(target,JSON.stringify(generation));await rm(file);await symlink(target,file);}
   else{const target=path.join(root,'secret');await mkdir(target);const parent=path.dirname(file);await rm(parent,{recursive:true});await symlink(target,parent);}
   await assert.rejects(createGenerationReader({root,renderer}).readActive());
  }finally{await rm(root,{recursive:true,force:true});}
 }
});

test('URL mapping preserves text even when text equals a canonical asset URL',()=>{
 const source=fixture(),src=source.projects[0].redesign.card.preview.front.src;
 source.projects[0].title=src;source.projects[0].redesign.card.preview.front.alt=src;
 const generation=createDeliveryGeneration(source,renderer),mapped=renderedProjects(generation);
 assert.equal(mapped[0].title,src);assert.equal(mapped[0].redesign.card.preview.front.alt,src);
});
test('byte MIME mismatch with a correct digest still blocks delivery',()=>{
 const source=fixture();const asset=source.assets[0];
 asset.bytes=Buffer.from('<html>wrong MIME</html>');
 // Keep the checksum valid to isolate actual MIME from corruption.
 asset.sha256=contentHash(asset.bytes);
 assert.throws(()=>createDeliveryGeneration(source,renderer),/MIME.*bytes/i);
});
test('package bytes remain immutable and HTML/CSS references must form a complete closure',()=>{
 const source=layoutFixture(),generation=createDeliveryGeneration(source,renderer);
 const scene=generation.projects[0].redesign.hero.scenes[0],base=scene.source.assetBase;
 assert.equal(renderedProjects(generation)[0].redesign.hero.scenes[0].source.assetBase,`/__content/${generation.contentId}${base}`);
 assert.equal(source.assets.find(a=>a.publicPath===base+'index.html').bytes.toString().includes(base+'app.js'),true);
 for(const name of ['image.png','style.css','app.js']){
  const broken=layoutFixture();
  for(const scene of broken.projects[0].redesign.hero.scenes)scene.source.files=scene.source.files.filter(f=>f.path!==name);
  broken.assets=broken.assets.filter(a=>a.publicPath!==base+name);
  assert.throws(()=>createDeliveryGeneration(broken,renderer),/Missing package dependency/);
 }
 const escaped=layoutFixture(),html=escaped.assets.find(a=>a.publicPath===base+'index.html');
 html.bytes=Buffer.from('<img src="../private.png">');html.sha256=contentHash(html.bytes);
 for(const scene of escaped.projects[0].redesign.hero.scenes){const entry=scene.source.files.find(f=>f.path==='index.html');entry.size=html.bytes.length;entry.sha256=html.sha256;}
 assert.throws(()=>createDeliveryGeneration(escaped,renderer),/Missing package dependency/);
});
test('old request handle keeps its documents/resources after a newer activation',async()=>{
 const root=await mkdtemp('/private/tmp/portfolio-delivery-');
 try{
  const a=fixture(),generationA=createDeliveryGeneration(a,renderer);await store(root,generationA,a);
  const reader=createGenerationReader({root,renderer}),handleA=await reader.readActive();
  const b=fixture();b.projects[0].title='New';const generationB=createDeliveryGeneration(b,renderer);await store(root,generationB,b);
  const descriptor={contractVersion:generationB.contractVersion,contentId:generationB.contentId,rendererId:renderer.rendererId,activationSeq:2};
  await writeFile(path.join(root,'active.json'),JSON.stringify(descriptor));
  assert.equal((await reader.readActive()).generation.projects[0].title,'New');
  assert.equal(handleA.generation.contentId,generationA.contentId);
  assert.deepEqual(await handleA.readAsset(a.assets[0].publicPath),a.assets[0].bytes);
  const bytes=await handleA.readAsset(a.assets[0].publicPath);bytes.fill(0);
  assert.deepEqual(await handleA.readAsset(a.assets[0].publicPath),a.assets[0].bytes);
  await store(root,generationA,a);
  await assert.rejects(reader.readActive({allowLastGood:false}),/Stale/);
  assert.equal((await reader.readActive()).generation.contentId,generationB.contentId);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('readiness is strict and does not report last-good as successful delivery',async()=>{
 const root=await mkdtemp('/private/tmp/portfolio-delivery-');
 try{
  const source=fixture(),generation=make(),dir=await store(root,generation,source);
  const reader=createGenerationReader({root,renderer});await reader.readActive();
  await writeFile(path.join(dir,source.assets[0].publicPath.slice(1)),'broken');
  await assert.rejects(reader.readActive({allowLastGood:false}));
  await assert.rejects((await reader.readActive()).readAsset(source.assets[0].publicPath));
  assert.equal(await (await reader.readActive()).readAsset('/private/db'),null);
 }finally{await rm(root,{recursive:true,force:true});}
});
