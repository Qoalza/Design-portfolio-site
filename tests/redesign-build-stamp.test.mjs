import assert from 'node:assert/strict';import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {stampNextBuild,verifyNextBuild} from '../tools/portfolio-release/build-stamp.mjs';
test('completed exact Next build is required; stale site, runtime and interrupted build are rejected',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'redesign-build-'));const sha='a'.repeat(40),nextSha='b'.repeat(40);
 const write=async(name,bytes)=>{const file=path.join(root,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes);};
 const manifest=value=>JSON.stringify({buildSha:value,sourceDirty:false});
 try{
  await write('.portfolio-release/site/site-manifest.json',manifest(sha));await write('.next/standalone/.portfolio-release/site/site-manifest.json',manifest(sha));await write('.next/standalone/server.js','valid runtime');await write('.next/BUILD_ID','completed-build');await write('.next/static/app.js','valid static');
  await assert.rejects(verifyNextBuild(root,sha));await stampNextBuild(root);await verifyNextBuild(root,sha);
  await write('.portfolio-release/site/site-manifest.json',manifest(nextSha));await assert.rejects(verifyNextBuild(root,nextSha),/completed clean|Stale/);await assert.rejects(stampNextBuild(root),/Stale standalone/);
  await write('.portfolio-release/site/site-manifest.json',manifest(sha));await write('.next/standalone/server.js','partial failed rebuild');await assert.rejects(verifyNextBuild(root,sha),/modified Next build/);
  await write('.next/standalone/server.js','valid runtime');await write('.next/static/app.js','changed static');await assert.rejects(verifyNextBuild(root,sha),/modified Next build/);
 }finally{await rm(root,{recursive:true,force:true});}
});
