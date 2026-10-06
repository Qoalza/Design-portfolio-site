import assert from 'node:assert/strict';import {mkdtemp,rm,readFile} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {spawn} from 'node:child_process';
import {prepare} from './database.mjs';import {locations,acquire,appRoot,serverListening} from './state.mjs';
const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-test-dev-writer-')),state=locations(root);
let server,completion,logs='';
try{
 const lock=await acquire(state);try{await prepare(state);}finally{await lock.release();}
 server=spawn(process.execPath,['scripts/run.mjs','dev'],{cwd:appRoot,env:{PATH:process.env.PATH,TMPDIR:path.dirname(root),PAYLOAD_RUNTIME_MODE:'fixture',PAYLOAD_LOCAL_ROOT:root,NEXT_TELEMETRY_DISABLED:'1',PAYLOAD_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
 completion=new Promise((resolve,reject)=>{server.once('exit',resolve);server.once('error',reject);});server.stdout.on('data',bytes=>{logs=(logs+bytes).slice(-16000);});server.stderr.on('data',bytes=>{logs=(logs+bytes).slice(-16000);});
 let ready=false;for(let i=0;i<180;i++){if(server.exitCode!==null)throw new Error('Dev writer failed: '+logs);try{if((await fetch(state.origin+'/admin/login',{signal:AbortSignal.timeout(1000)})).status===200){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
 assert.ok(ready,'actual dev login loads');const owner=JSON.parse(await readFile(path.join(state.lock,'owner.json'),'utf8'));assert.equal(owner.pid,server.pid);assert.ok(owner.childPID);
 process.kill(owner.childPID,'SIGKILL');await completion;assert.equal(await serverListening(state.port),false,'actual server dies with tracked writer');
 const next=await acquire(state);await next.release();console.log('PASS: actual dev server owns tracked lifetime PID; SIGKILL leaves no writer/port');
}finally{
 if(server&&server.exitCode===null){server.kill('SIGTERM');await completion;}
 for(const file of [root,state.backups,state.lock,state.journal,state.lock+'.maintenance.db',state.lock+'.maintenance.db-journal'])await rm(file,{recursive:true,force:true});
}
