import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hostname} from 'node:os';
import {randomUUID} from 'node:crypto';
import {readdir,rename,rm,lstat} from 'node:fs/promises';
import {assertDirectory,readJSON,flushDirectory,withActivationLock} from '../../portfolio-delivery/durable-store.mjs';
import {exactObject} from '../../portfolio-delivery/contract.mjs';
import {locations,acquire,unlock} from './state.mjs';
import {verifyCMSArtifact} from './artifact.mjs';

async function deadClaim(directory){
 await assertDirectory(directory);
 if(JSON.stringify((await readdir(directory)).sort())!==JSON.stringify(['owner.json']))throw new Error('Unknown activation recovery claim contents');
 const owner=await readJSON(path.join(directory,'owner.json'),4096);
 exactObject(owner,['pid','host','token'],'Recovery owner');
 if(owner.host!==hostname()||!Number.isSafeInteger(owner.pid)||owner.pid<1||typeof owner.token!=='string'||!/^[a-f0-9-]{36}$/.test(owner.token))throw new Error('Unknown activation recovery owner');
 try{process.kill(owner.pid,0);throw new Error('Activation recovery owner is alive');}catch(error){if(error.code!=='ESRCH')throw error;}
 return owner;
}
export async function recoverActivationClaim(state,lock){
 const ownerFile=path.join(state.lock,'owner.json');
 const owner=await readJSON(ownerFile,4096);
 if(lock.ownerFile!==ownerFile||owner.host!==hostname()||owner.pid!==process.pid||owner.token!==lock.token||owner.childPID!==null)throw new Error('Exclusive CMS maintenance ownership required');
 const privateRoot=path.join(state.root,'delivery');
 await assertDirectory(privateRoot);
 const recovery=path.join(privateRoot,'activation.lock.recovery');
 let present=true;
 try{await lstat(recovery);}catch(error){if(error.code!=='ENOENT')throw error;present=false;}
 const dead=present?await deadClaim(recovery):null;
 if(dead){
  // A visible dead claim blocks ordinary recovery; no compliant owner replaces it.
  // Root ownership excludes CMS startup. A concurrent code controller may still
  // win the activation lock; withActivationLock then fails without stealing it.
  const tomb=recovery+'.'+randomUUID()+'.retired';
  await rename(recovery,tomb);await flushDirectory(privateRoot);await rm(tomb,{recursive:true});
 }
 await withActivationLock(privateRoot,async()=>{});
 return {recovered:true};
}
export async function maintenance(args=process.argv.slice(2)){
 if(args.length!==1||!['unlock','recover-activation'].includes(args[0]))throw new Error('Use unlock or recover-activation with explicit server/fixture runtime');
 const state=locations();
 if(!state.server&&!state.fixture)throw new Error('Packaged maintenance requires explicit server or disposable fixture mode');
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
 await verifyCMSArtifact(root,{fixture:state.fixture});
 await assertDirectory(state.root);
 await assertDirectory(path.dirname(state.lock));
 if(args[0]==='unlock'){await unlock(state);return {unlocked:true};}
 const lock=await acquire(state);
 try{return await recoverActivationClaim(state,lock);}finally{await lock.release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))maintenance().then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
