import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,realpath,mkdir,writeFile,access,readFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';import {createServer} from 'node:net';
import {acquire} from '../tools/payload-admin/scripts/state.mjs';
import {recoverActivationClaim} from '../tools/payload-admin/scripts/artifact-maintenance.mjs';
import {withActivationLock} from '../tools/portfolio-delivery/durable-store.mjs';
async function fixture(t){const root=await mkdtemp(path.join(await realpath(os.tmpdir()),'des-art-payload-test-maintenance-'));t.after(()=>rm(root,{recursive:true,force:true}));const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));const state={root,lock:root+'-lock',journal:root+'-restore.json',port};const privateRoot=path.join(root,'delivery');await mkdir(privateRoot);return {state,privateRoot};}
async function claim(root,name,owner){await mkdir(path.join(root,name));await writeFile(path.join(root,name,'owner.json'),JSON.stringify(owner));}
const dead=()=>({pid:2147483647,host:os.hostname(),token:randomUUID()});
test('exclusive root maintenance clears dead recovery then recovers dead activation without touching authoring data',async t=>{
 const {state,privateRoot}=await fixture(t);await writeFile(path.join(state.root,'cms.db'),'unchanged DB');await writeFile(path.join(state.root,'secret'),'unchanged secret');await claim(privateRoot,'activation.lock',dead());await claim(privateRoot,'activation.lock.recovery',dead());
 await assert.rejects(withActivationLock(privateRoot,async()=>{}),/recovery is busy/);const lock=await acquire(state);
 try{await assert.rejects(acquire(state),/занято/);assert.deepEqual(await recoverActivationClaim(state,lock),{recovered:true});}finally{await lock.release();}
 await assert.rejects(access(path.join(privateRoot,'activation.lock')),{code:'ENOENT'});await assert.rejects(access(path.join(privateRoot,'activation.lock.recovery')),{code:'ENOENT'});assert.equal(await readFile(path.join(state.root,'cms.db'),'utf8'),'unchanged DB');assert.equal(await readFile(path.join(state.root,'secret'),'utf8'),'unchanged secret');
});
test('live or foreign claim remains; forged or child-bearing root ownership is refused',async t=>{
 for(const owner of [{...dead(),pid:process.pid},{...dead(),host:'unknown-host'}]){const {state,privateRoot}=await fixture(t);await claim(privateRoot,'activation.lock.recovery',owner);const lock=await acquire(state);try{await assert.rejects(recoverActivationClaim(state,lock),/alive|Unknown/);await access(path.join(privateRoot,'activation.lock.recovery'));await assert.rejects(recoverActivationClaim(state,{...lock,token:randomUUID()}),/Exclusive/);await lock.child(process.pid);await assert.rejects(recoverActivationClaim(state,lock),/Exclusive/);await lock.child(null);}finally{await lock.release();}}
});
test('orphan dead recovery is cleared, live activation remains and maintenance fails closed',async t=>{
 const {state,privateRoot}=await fixture(t);await claim(privateRoot,'activation.lock.recovery',dead());const lock=await acquire(state);try{await recoverActivationClaim(state,lock);await claim(privateRoot,'activation.lock',{...dead(),pid:process.pid});await claim(privateRoot,'activation.lock.recovery',dead());await assert.rejects(recoverActivationClaim(state,lock),/busy/);assert.equal(JSON.parse(await readFile(path.join(privateRoot,'activation.lock/owner.json'))).pid,process.pid);}finally{await lock.release();}
});
test('malformed or extra claim contents stay untouched instead of reporting successful recovery',async t=>{
 const {state,privateRoot}=await fixture(t),recovery=path.join(privateRoot,'activation.lock.recovery');await mkdir(recovery);const lock=await acquire(state);try{await assert.rejects(recoverActivationClaim(state,lock),/Unknown/);await writeFile(path.join(recovery,'owner.json'),JSON.stringify(dead()));await writeFile(path.join(recovery,'unknown'),'preserve');await assert.rejects(recoverActivationClaim(state,lock),/Unknown/);assert.equal(await readFile(path.join(recovery,'unknown'),'utf8'),'preserve');}finally{await lock.release();}
});
test('empty, malformed and extra-entry activation locks remain intact',async t=>{
 for(const shape of ['empty','malformed','extra']){const {state,privateRoot}=await fixture(t),activation=path.join(privateRoot,'activation.lock');await mkdir(activation);if(shape==='malformed')await writeFile(path.join(activation,'owner.json'),'{}');if(shape==='extra'){await writeFile(path.join(activation,'owner.json'),JSON.stringify(dead()));await writeFile(path.join(activation,'unknown'),'preserve');}const lock=await acquire(state);try{await assert.rejects(recoverActivationClaim(state,lock));await access(activation);if(shape==='extra')assert.equal(await readFile(path.join(activation,'unknown'),'utf8'),'preserve');}finally{await lock.release();}}
});
