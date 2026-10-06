import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {hostname} from 'node:os';
import {randomUUID} from 'node:crypto';
import {withActivationLock,atomicJSON,readJSON,assertDirectory} from '../tools/portfolio-delivery/durable-store.mjs';

test('activation lock exposes complete owner before task and rejects simultaneous live owners',async()=>{
 const root=await mkdtemp('/private/tmp/delivery-lock-');try {
  let release,started;const ready=new Promise(resolve=>{started=resolve;});
  const running=withActivationLock(root,async()=>{assert.equal((await readJSON(path.join(root,'activation.lock/owner.json'))).pid,process.pid);started();await new Promise(resolve=>{release=resolve;});});
  await ready;await assert.rejects(()=>withActivationLock(root,async()=>assert.fail('Concurrent task')),/busy/);release();await running;
  let ran=false;await withActivationLock(root,async()=>{ran=true;});assert.equal(ran,true);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('two recoverers of a dead owner never run tasks concurrently',async()=>{
 const root=await mkdtemp('/private/tmp/delivery-dead-lock-');try {
  const child=spawn(process.execPath,['-e','process.stdout.write(String(process.pid))'],{stdio:['ignore','pipe','ignore']});let output='';child.stdout.on('data',data=>{output+=data;});await new Promise(resolve=>child.once('exit',resolve));
  await mkdir(path.join(root,'activation.lock'));await writeFile(path.join(root,'activation.lock/owner.json'),JSON.stringify({pid:Number(output),host:hostname(),token:randomUUID()}));
  let running=0,maximum=0,release;const wait=new Promise(resolve=>{release=resolve;});
  const task=async()=>{running++;maximum=Math.max(maximum,running);await wait;running--;};
  const attempts=[withActivationLock(root,task),withActivationLock(root,task)];
  // The winning task publishes its owner before waiting; drive this test through
  // observation, not a timing assumption. The loser is expected to fail closed.
  for(let i=0;i<100&&!running;i++)await new Promise(resolve=>setImmediate(resolve));
  release();const results=await Promise.allSettled(attempts);assert.equal(results.filter(result=>result.status==='fulfilled').length,1);assert.equal(maximum,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('atomic writes and reads reject symlink roots and symlink descriptor targets',async()=>{
 const root=await mkdtemp('/private/tmp/delivery-store-');try {
  await mkdir(path.join(root,'real'));await symlink(path.join(root,'real'),path.join(root,'alias'));
  await assert.rejects(()=>assertDirectory(path.join(root,'alias')),/real directory/);
  const file=path.join(root,'real/state.json');await atomicJSON(file,{v:1});await atomicJSON(file,{v:2});assert.deepEqual(await readJSON(file),{v:2});
  await symlink(file,path.join(root,'pointer.json'));await assert.rejects(()=>atomicJSON(path.join(root,'pointer.json'),{v:3}),/regular file/);assert.equal(JSON.parse(await readFile(file,'utf8')).v,2);
 }finally{await rm(root,{recursive:true,force:true});}
});
