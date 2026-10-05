import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {EventEmitter} from 'node:events';import {PassThrough} from 'node:stream';
import {operationIdentity,parseOperation,startOperation,readOperation,uploadArchive} from '../tools/portfolio-release/deploy-transport.mjs';
const sha='a'.repeat(40),hash='b'.repeat(64),id=operationIdentity(sha,hash),config={host:'server.example.test',user:'deploy',keyPath:'/private/tmp/fake-deploy-key'};
const status={protocol:'art-des-deploy-v2',operationId:id,targetSha:sha,state:'running',phase:'activate',updatedAt:new Date().toISOString()};
test('exact forced deploy protocol, no legacy commands, mismatched operation rejected',async()=>{
 const commands=[];const command=async(file,args)=>{commands.push([file,args]);return {stdout:JSON.stringify(status)}};
 assert.equal((await startOperation({config,sha,artifactHash:hash,command})).operationId,id);
 assert.equal((await readOperation({config,id,command})).targetSha,sha);
 assert.ok(commands[0][1].includes('start-v2'));assert.ok(commands[1][1].includes('status-v2'));
 assert.throws(()=>parseOperation(JSON.stringify({...status,targetSha:'c'.repeat(40)}),id),/Mismatched/);
 await assert.rejects(startOperation({config:{...config,user:'-bad'},sha,artifactHash:hash,command}),/configuration/);
 assert.equal(commands.length,2);
});
test('exact bounded archive upload verifies response and fails without progress',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'payload-transport-'));
 try{
  const archive=path.join(root,'runtime.tar.gz'),bytes=Buffer.from('fixture archive'),artifactHash=createHash('sha256').update(bytes).digest('hex');await writeFile(archive,bytes);
  const makeChild=(correct=true)=>{const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.kill=()=>{};child.stdin.on('finish',()=>{child.stdout.write(JSON.stringify({protocol:'art-des-deploy-v2',state:'uploaded',targetSha:sha,artifactSha256:correct?artifactHash:hash,bytes:bytes.length}));child.emit('close',0);});return child;};
  let sentArgs;await uploadArchive({config,archive,sha,artifactHash,bytes:bytes.length,spawnImpl:(file,args)=>{assert.equal(file,'ssh');sentArgs=args;return makeChild();}});assert.ok(sentArgs.includes('upload-v2'));
  await assert.rejects(uploadArchive({config,archive,sha,artifactHash,bytes:bytes.length,spawnImpl:()=>makeChild(false)}),/identity mismatch/);
  await assert.rejects(uploadArchive({config,archive,sha,artifactHash:hash,bytes:bytes.length}),/changed/);
  const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.kill=()=>{};
  await assert.rejects(uploadArchive({config,archive,sha,artifactHash,bytes:bytes.length,spawnImpl:()=>child,noProgressMs:5,timeoutMs:100}),/no progress/);
 }finally{await rm(root,{recursive:true,force:true})}
});
