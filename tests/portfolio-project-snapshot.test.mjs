import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { exportApprovedRedesign } from '../tools/concept-v2/export-approved-content.mjs';
import { createProjectSnapshot, validateProjectSnapshot } from '../tools/portfolio-release/project-snapshot.mjs';
const repoRoot=fileURLToPath(new URL('..',import.meta.url));
let exported;
const get=async()=>exported??=await exportApprovedRedesign({repoRoot});
test('approved content becomes a complete portable redesign snapshot without server paths or bytes',async()=>{
 const source=await get(), snapshot=createProjectSnapshot(source);
 assert.equal(snapshot.version,1);
 assert.deepEqual(snapshot.projects,source.projects);
 assert.equal(snapshot.assets.length,source.assets.length);
 assert.deepEqual(validateProjectSnapshot(JSON.parse(JSON.stringify(snapshot))),snapshot);
 for(const asset of snapshot.assets)assert.deepEqual(Object.keys(asset).sort(),['publicPath','sha256','size']);
 assert.equal(JSON.stringify(snapshot).includes(repoRoot),false);
});
test('missing images, scene files or forged file digests prevent snapshot construction',async()=>{
 const source=await get();
 const front=source.projects[0].redesign.card.preview.front.src;
 const entry=source.projects[0].redesign.hero.scenes[0].source;
 for(const missing of [front,entry.assetBase+entry.entry,front.replace('.png','-640.avif'),front.replace('.png','-1080.avif')]){
  assert.throws(()=>createProjectSnapshot({...source,assets:source.assets.filter(a=>a.publicPath!==missing)}),/missing/i);
 }
 const assets=source.assets.map(a=>({...a}));assets[0].bytes=Buffer.from('corrupt');
 assert.throws(()=>createProjectSnapshot({...source,assets}),/checksum/i);
 const mismatch=source.assets.map(a=>({...a}));mismatch.find(a=>a.publicPath===entry.assetBase+entry.entry).sha256='0'.repeat(64);
 assert.throws(()=>createProjectSnapshot({...source,assets:mismatch}),/checksum/i);
});
test('snapshot rejects duplicates, drafts, unknown fields and unsafe public asset paths',async()=>{
 const baseline=createProjectSnapshot(await get());
 const mutations=[s=>s.version=2,s=>s.privateDatabase='/local/db',s=>s.projects.push(s.projects[0]),s=>s.projects[0].visibility='draft',s=>s.assets.push(s.assets[0]),s=>s.assets[0].publicPath='/assets/projects/corvo/../secret',s=>s.assets[0].publicPath='/assets/projects/corvo/%2e%2e/secret',s=>s.assets[0].publicPath='http://localhost:41740/image',s=>s.assets[0].size=-1,s=>s.assets[0].sha256='wrong',s=>s.assets[0].privatePath='/local/media',s=>delete s.projects[0].redesign,s=>s.provenance.sourceSha='wrong',s=>s.provenance.files[0].path='/local/secret',s=>s.provenance.files[0].privateToken='secret',s=>s.provenance.externalDependencies=['https://localhost:41740/file'],s=>s.provenance.externalDependencies=['https://127.0.0.1/file'],s=>s.provenance.externalDependencies=['https://localhost./private'],s=>s.provenance.externalDependencies=['https://host.local./private']];
 for(const mutate of mutations){const candidate=structuredClone(baseline);mutate(candidate);assert.throws(()=>validateProjectSnapshot(candidate));}
});
test('manifest file size and digest must agree with each layout source',async()=>{
 const baseline=createProjectSnapshot(await get()),candidate=structuredClone(baseline);
 const source=candidate.projects[0].redesign.hero.scenes[0].source;
 candidate.assets.find(a=>a.publicPath===source.assetBase+source.entry).size++;
 assert.throws(()=>validateProjectSnapshot(candidate),/manifest/i);
});

test('HTML dependency removed from both manifest and files still blocks snapshot construction',async()=>{
 const source=await get(),projects=structuredClone(source.projects);
 const missing='authorization/style.css';
 const assetBase=projects[0].redesign.hero.scenes[0].source.assetBase;
 for(const scene of projects[0].redesign.hero.scenes)scene.source.files=scene.source.files.filter(file=>file.path!==missing);
 assert.throws(()=>createProjectSnapshot({...source,projects,assets:source.assets.filter(a=>a.publicPath!==assetBase+missing)}),/Missing package dependency/);
});
test('layout source rejects private hosts with terminal DNS dots',async()=>{
 const source=await get();
 for(const url of ['https://localhost./private','https://host.local./private','https://host.internal./private']){
  const projects=structuredClone(source.projects);projects[0].redesign.hero.scenes[0].source={kind:'url',url};
  assert.throws(()=>createProjectSnapshot({...source,projects}),/source.url/);
 }
});
