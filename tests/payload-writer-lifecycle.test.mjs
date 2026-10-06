import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,realpath,writeFile,readFile,rm,mkdir,access} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import {createServer} from 'node:net';import {spawn} from 'node:child_process';import {randomUUID} from 'node:crypto';
import {acquire,unlock} from '../tools/payload-admin/scripts/state.mjs';import {launchWriter} from '../tools/payload-admin/scripts/writer-process.mjs';
async function fixture(t){const root=await mkdtemp(path.join(await realpath(os.tmpdir()),'des-art-payload-test-lock-'));t.after(()=>rm(root,{recursive:true,force:true}));const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));return {root,state:{lock:path.join(root,'writer.lock'),journal:path.join(root,'restore.json'),port}};}
async function absent(file){await assert.rejects(access(file),{code:'ENOENT'});}
test('one writer; lifecycle barrier precedes imports; live unlock fails; exit permits maintenance',async t=>{
 const {root,state}=await fixture(t),marker=path.join(root,'marker');await writeFile(path.join(root,'entry.mjs'),`import {writeFile} from 'node:fs/promises'; await writeFile(process.env.MARKER,'started'); process.disconnect();`);
 const lock=await acquire(state);await assert.rejects(acquire(state),/занято/);await assert.rejects(unlock(state),/работает/);
 const code=await launchWriter({lock,cwd:root,entry:'entry.mjs',env:{MARKER:marker}});assert.ok(code===1||code===0);assert.equal(await readFile(marker,'utf8'),'started');await lock.release();await absent(state.lock);
 const next=await acquire(state);await next.release();
});
test('registration failure cannot execute writer code or release a live child',async t=>{
 const {root,state}=await fixture(t),marker=path.join(root,'marker');await writeFile(path.join(root,'entry.mjs'),`import {writeFile} from 'node:fs/promises'; await writeFile(process.env.MARKER,'unexpected');`);
 const lock=await acquire(state);const fake={...lock,child:async pid=>{if(pid!==null)throw new Error('registration-disk-failure');return lock.child(null);}};
 await assert.rejects(launchWriter({lock:fake,cwd:root,entry:'entry.mjs',env:{MARKER:marker}}),/registration-disk-failure/);await absent(marker);await lock.release();
});
test('dead lock recovery serializes claims; unknown owner fails closed',async t=>{
 const {state}=await fixture(t);await mkdir(state.lock);await writeFile(path.join(state.lock,'owner.json'),JSON.stringify({host:os.hostname(),pid:2147483647,childPID:null,token:randomUUID()}));
 const results=await Promise.allSettled([unlock(state),unlock(state)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);await absent(state.lock);
 const live=await acquire(state);await assert.rejects(unlock(state),/работает/);await live.release();await mkdir(state.lock);await assert.rejects(unlock(state));await access(state.lock);
});
test('supervisor death terminates only its child and retains dead-owner lock for explicit recovery',async t=>{
 const {root,state}=await fixture(t),marker=path.join(root,'marker'),entry=path.join(root,'entry.mjs');
 await writeFile(entry,`import {writeFile} from 'node:fs/promises';await writeFile(process.env.MARKER,String(process.pid));setInterval(()=>{},1000);`);
 const stateURL=new URL('../tools/payload-admin/scripts/state.mjs',import.meta.url).href,launchURL=new URL('../tools/payload-admin/scripts/writer-process.mjs',import.meta.url).href;
 const supervisor=path.join(root,'parent.mjs');await writeFile(supervisor,`import {acquire} from ${JSON.stringify(stateURL)};import {launchWriter} from ${JSON.stringify(launchURL)};const lock=await acquire(${JSON.stringify(state)});try{await launchWriter({lock,cwd:${JSON.stringify(root)},entry:${JSON.stringify(entry)},env:{MARKER:${JSON.stringify(marker)}}});}finally{await lock.release();}`);
 const parent=spawn(process.execPath,[supervisor],{env:{},stdio:['ignore','ignore','pipe']});let stderr='';parent.stderr.on('data',chunk=>{stderr+=chunk;});t.after(()=>parent.kill('SIGKILL'));
 const completion=new Promise(resolve=>parent.once('exit',resolve));
 let pid;for(let i=0;i<200;i++){try{pid=Number(await readFile(marker,'utf8'));break;}catch{await new Promise(resolve=>setTimeout(resolve,10));}}
 assert.ok(pid,stderr);parent.kill('SIGKILL');await completion;
 let stopped=false;for(let i=0;i<200;i++){try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH'){stopped=true;break;}throw e;}await new Promise(resolve=>setTimeout(resolve,10));}
 assert.ok(stopped,'orphan child exits after losing supervisor');await access(state.lock);await unlock(state);await absent(state.lock);
});
test('OS maintenance mutex is released after crash rather than leaving an unrecoverable claim',async t=>{
 const {root,state}=await fixture(t);await mkdir(state.lock);await writeFile(path.join(state.lock,'owner.json'),JSON.stringify({host:os.hostname(),pid:2147483647,childPID:null,token:randomUUID()}));
 const moduleURL=new URL('../tools/payload-admin/scripts/state.mjs',import.meta.url).href,marker=path.join(root,'claim');
 const script=path.join(root,'maintenance.mjs');await writeFile(script,`import {lifecycleTransition} from ${JSON.stringify(moduleURL)};import {writeFile} from 'node:fs/promises';await lifecycleTransition(${JSON.stringify(state)},async()=>{await writeFile(${JSON.stringify(marker)},'held');setInterval(()=>{},1000);await new Promise(()=>{});});`);
 const child=spawn(process.execPath,[script],{env:{},stdio:'ignore'});t.after(()=>child.kill('SIGKILL'));const completion=new Promise(resolve=>child.once('exit',resolve));
 for(let i=0;i<200;i++){try{await access(marker);break;}catch{await new Promise(resolve=>setTimeout(resolve,10));}}
 await access(marker);await assert.rejects(unlock(state),/занято/);child.kill('SIGKILL');await completion;await unlock(state);await absent(state.lock);
});
test('shutdown is recorded even when a writer exits with Next restart code',async t=>{
 const {root,state}=await fixture(t),marker=path.join(root,'ready');await writeFile(path.join(root,'entry.mjs'),`import {writeFile} from 'node:fs/promises';process.on('SIGTERM',()=>process.exit(77));await writeFile(process.env.MARKER,'ready');setInterval(()=>{},1000);`);
 const lock=await acquire(state);let stopRequested=false;const completion=launchWriter({lock,cwd:root,entry:'entry.mjs',env:{MARKER:marker},onStop:()=>{stopRequested=true;}});
 for(let i=0;i<200;i++){try{await access(marker);break;}catch{await new Promise(resolve=>setTimeout(resolve,10));}}
 await access(marker);process.emit('SIGTERM');assert.equal(await completion,77);assert.equal(stopRequested,true);await lock.release();
});

test('finished maintenance exits naturally without an IPC channel keeping its lock alive',async t=>{
 const {root,state}=await fixture(t),marker=path.join(root,'done');await writeFile(path.join(root,'entry.mjs'),`import {writeFile} from 'node:fs/promises';await writeFile(process.env.MARKER,'complete');`);const lock=await acquire(state);assert.equal(await launchWriter({lock,cwd:root,entry:'entry.mjs',env:{MARKER:marker}}),0);assert.equal(await readFile(marker,'utf8'),'complete');await lock.release();
});
