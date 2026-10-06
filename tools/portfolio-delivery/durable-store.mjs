import { constants, open, lstat, mkdir, rename, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { canonicalJSON } from './contract.mjs';

export async function assertDirectory(directory, {create=false, mode=0o700}={}) {
 const absolute=path.resolve(directory);
 let current=path.parse(absolute).root;
 for(const component of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
  current=path.join(current,component);
  if(create) await mkdir(current,{mode}).catch(error=>{if(error.code!=='EEXIST')throw error;});
  const info=await lstat(current);
  if(!info.isDirectory()||info.isSymbolicLink())throw new Error('Store directory must be a real directory.');
 }
 return absolute;
}
export async function flushDirectory(directory) {
 const handle=await open(directory,constants.O_RDONLY|constants.O_NOFOLLOW);
 try {await handle.sync();} finally {await handle.close();}
}
export async function readJSON(file,maxBytes=16*1024*1024) {
 await assertDirectory(path.dirname(file));
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
 try {
  const stat=await handle.stat();
  if(!stat.isFile()||stat.size>maxBytes)throw new Error('Invalid store file.');
  const bytes=await handle.readFile();
  if(bytes.length!==stat.size)throw new Error('Store file changed while reading.');
  return JSON.parse(bytes.toString('utf8'));
 } finally {await handle.close();}
}
export async function writeFileDurable(file,bytes,mode=0o600) {
 await assertDirectory(path.dirname(file),{create:true,mode:mode===0o644?0o755:0o700});
 const handle=await open(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,mode);
 try {await handle.writeFile(bytes);await handle.sync();} finally {await handle.close();}
 await flushDirectory(path.dirname(file));
}
export async function atomicJSON(file,value,{mode=0o600}={}) {
 try {const stat=await lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('Atomic store target is not a regular file.');}catch(error){if(error.code!=='ENOENT')throw error;}
 const temporary=file+'.'+randomUUID()+'.tmp';
 try {
  await writeFileDurable(temporary,Buffer.from(canonicalJSON(value)),mode);
  await rename(temporary,file);
  await flushDirectory(path.dirname(file));
 } finally {await rm(temporary,{force:true});}
}
// Shared by publication and renderer/code activation. A dead local owner may be
// recovered; live, unknown or reused PIDs are never stolen. PID reuse can block
// progress, which is preferable to allowing two writers.
export async function withActivationLock(privateRoot,task) {
 await assertDirectory(privateRoot,{create:true});
 const directory=path.join(privateRoot,'activation.lock'),token=randomUUID();
 async function preparedLock(destination,owner) {
  const prepared=destination+'.'+owner.token+'.prepared';
  await mkdir(prepared,{mode:0o700});
  try {
   await atomicJSON(path.join(prepared,'owner.json'),owner);
   await flushDirectory(prepared);
   // The destination is always nonempty once visible. POSIX rename cannot
   // replace another nonempty lock directory; ownership is installed atomically.
   await rename(prepared,destination);await flushDirectory(privateRoot);
  } finally {await rm(prepared,{recursive:true,force:true});}
 }
 const owner={pid:process.pid,host:hostname(),token};
 try {await preparedLock(directory,owner);}
 catch(error) {
  if(!['EEXIST','ENOTEMPTY'].includes(error.code))throw error;
  const recovery=directory+'.recovery';
  // A recovery claim is also prepared atomically. A crashed recovery blocks
  // further recovery rather than guessing who owns it. Lifecycle maintenance
  // can clear a verified dead recovery claim under the exclusive CMS root lock.
  await preparedLock(recovery,owner).catch(()=>{throw new Error('Activation lock recovery is busy.');});
  try {
   await assertDirectory(directory);
   const dead=await readJSON(path.join(directory,'owner.json'),4096);
   if(dead.host!==hostname()||!Number.isSafeInteger(dead.pid)||dead.pid<1||typeof dead.token!=='string'||!/^[a-f0-9-]{36}$/.test(dead.token))throw new Error('Activation lock has an unknown owner.');
   try {process.kill(dead.pid,0);throw new Error('Activation is busy.');}
   catch(error) {if(error.code!=='ESRCH')throw error;}
   const tomb=directory+'.'+dead.token+'.dead';
   await rename(directory,tomb);await rm(tomb,{recursive:true});
   // An ordinary acquirer may win the empty interval. preparedLock then fails
   // closed; recovery never renames or removes its live replacement.
   await preparedLock(directory,owner);
  } finally {const released=recovery+'.'+token+'.released';await rename(recovery,released);await flushDirectory(privateRoot);await rm(released,{recursive:true});}
 }
 try {return await task();}
 finally {
  const observed=await readJSON(path.join(directory,'owner.json'),4096);
  if(observed.token!==token)throw new Error('Activation lock ownership changed.');
  const released=directory+'.'+token+'.released';
  await rename(directory,released);await flushDirectory(privateRoot);
  await rm(released,{recursive:true});
 }
}
export async function listJSON(directory) {
 await assertDirectory(directory,{create:true});
 const names=await readdir(directory);
 return names.filter(name=>name.endsWith('.json')).sort();
}
