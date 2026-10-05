import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,writeFile,cp} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
import {selectReleaseContent,contentHash} from '../tools/portfolio-release/content-source.mjs';
import {projectDetailForPath} from '../tools/concept-v2/app/src/project-page/project-view-model.mjs';
const repoRoot=path.resolve(import.meta.dirname,'..');
test('release source is explicit and digest-bound; incomplete/corrupt/cross-source input rejected',async()=>{
 const directory=process.env.PORTFOLIO_PROJECT_SNAPSHOT;assert.ok(directory,'Native exported fixture required');
 const bytes=await readFile(path.join(directory,'snapshot.json')),expectedInputHash=contentHash(bytes);
 const selected=await selectReleaseContent({repoRoot,kind:'payload-published',directory,expectedInputHash});
 assert.equal(selected.prepared.provenance.origin,'payload-published');assert.equal(selected.snapshotSha256,contentHash(selected.snapshotBytes));
 assert.equal(selected.snapshotBytes.includes(Buffer.from('_payloadEditor')),false);
 await assert.rejects(selectReleaseContent({repoRoot,directory,expectedInputHash}),/Initial Git/);
 await assert.rejects(selectReleaseContent({repoRoot,kind:'payload-published',directory}),/digest required/);
 await assert.rejects(selectReleaseContent({repoRoot,kind:'payload-published',directory,expectedInputHash:'0'.repeat(64)}),/digest mismatch/);
 const temp=await mkdtemp(path.join(os.tmpdir(),'payload-snapshot-source-'));
 try{
  await cp(directory,temp,{recursive:true});
  const asset=selected.prepared.assets[0];await writeFile(path.join(temp,asset.publicPath.slice(1)),Buffer.from('corrupt'));
  await assert.rejects(selectReleaseContent({repoRoot,kind:'payload-published',directory:temp,expectedInputHash}),/mismatch/);
 }finally{await rm(temp,{recursive:true,force:true})}
 for(const profile of ['corvo-v1','sarafan-v1']){
  const original=selected.prepared.projects.find(project=>project.designProfile===profile);
  const renamed={...original,slug:'new-case-address'};
  assert.equal(projectDetailForPath([renamed],'/projects/new-case-address'),renamed);
  assert.equal(projectDetailForPath([renamed],'/projects/'+original.slug),undefined);
  assert.equal(projectDetailForPath([{...renamed,visibility:'draft'}],'/projects/new-case-address'),undefined);
  assert.equal(projectDetailForPath([renamed],'/projects/new-case-address/extra'),undefined);
 }
});
