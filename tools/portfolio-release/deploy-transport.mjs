// Neutral infrastructure transport. No Admin store, Git/content migration or UI logic.
import {spawn,execFile} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile),shaPattern=/^[a-f0-9]{40}$/,hashPattern=/^[a-f0-9]{64}$/;
export function operationIdentity(sha,hash){if(!shaPattern.test(sha)||!hashPattern.test(hash))throw new Error('Invalid deploy identity');return `${sha}-${hash.slice(0,16)}`;}
function args(config){if(!config||!/^([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)$/.test(config.host)||!/[.]/.test(config.host)||!/^[a-z][a-z0-9_-]*$/.test(config.user)||!path.isAbsolute(config.keyPath)||/[\u0000-\u001f]/.test(config.keyPath))throw new Error('Invalid deploy configuration');return ['-o','BatchMode=yes','-o','ConnectTimeout=15','-o','ServerAliveInterval=15','-o','ServerAliveCountMax=4','-i',config.keyPath,`${config.user}@${config.host}`];}
export function parseOperation(output,expectedId){
 let value;try{value=JSON.parse(output);}catch{throw new Error('Invalid deploy status');}
 if(value?.protocol!=='art-des-deploy-v2'||value.operationId!==expectedId||!shaPattern.test(value.targetSha)||!expectedId.startsWith(value.targetSha+'-')||!['queued','running','complete','failed'].includes(value.state)||!['validate','activate','readiness','retention','complete'].includes(value.phase)||!Number.isFinite(Date.parse(value.updatedAt)))throw new Error('Mismatched deploy status');
 if(value.errorCode!==undefined&&!/^[A-Z_]{1,64}$/.test(value.errorCode))throw new Error('Invalid deploy error code');
 return {operationId:value.operationId,targetSha:value.targetSha,state:value.state,phase:value.phase,updatedAt:value.updatedAt,...(value.errorCode?{errorCode:value.errorCode}:{})};
}
export async function startOperation({config,sha,artifactHash,command=exec}){
 const id=operationIdentity(sha,artifactHash);
 const {stdout}=await command('ssh',[...args(config),'start-v2',sha,artifactHash],{timeout:20000,maxBuffer:16384,killSignal:'SIGTERM'});
 return parseOperation(stdout,id);
}
export async function readOperation({config,id,command=exec}){
 if(!/^[a-f0-9]{40}-[a-f0-9]{16}$/.test(id))throw new Error('Invalid deploy operation id');
 const {stdout}=await command('ssh',[...args(config),'status-v2',id],{timeout:20000,maxBuffer:16384,killSignal:'SIGTERM'});
 return parseOperation(stdout,id);
}
export async function uploadArchive({config,archive,sha,artifactHash,bytes,onProgress=()=>{},spawnImpl=spawn,noProgressMs=90000,timeoutMs=900000}){
 operationIdentity(sha,artifactHash);const stat=await lstat(archive);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==bytes||bytes<1||bytes>75*1024*1024)throw new Error('Invalid release archive');
 const hash=createHash('sha256');for await(const chunk of createReadStream(archive))hash.update(chunk);
 if(hash.digest('hex')!==artifactHash)throw new Error('Release archive changed');
 const sshArgs=[...args(config),'upload-v2',sha,artifactHash,String(bytes)];
 await new Promise((resolve,reject)=>{
  const source=createReadStream(archive),child=spawnImpl('ssh',sshArgs,{stdio:['pipe','pipe','ignore']});
  let output='',transferred=0,settled=false,progressTimer;
  const finish=error=>{if(settled)return;settled=true;clearTimeout(progressTimer);clearTimeout(timer);source.destroy();if(error){child.kill('SIGTERM');reject(error);}else resolve();};
  const timer=setTimeout(()=>finish(new Error('Upload deadline exceeded')),timeoutMs);
  const progress=()=>{clearTimeout(progressTimer);progressTimer=setTimeout(()=>finish(new Error('Upload made no progress')),noProgressMs);};
  child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{output+=chunk;if(output.length>16384)finish(new Error('Invalid upload response'));});
  source.on('data',chunk=>{transferred+=chunk.length;progress();try{onProgress({bytesTransferred:transferred,bytesTotal:bytes});}catch{finish(new Error('Upload progress failed'));}});
  source.on('error',()=>finish(new Error('Archive read failed')));child.stdin.on('error',()=>finish(new Error('Upload connection failed')));child.on('error',()=>finish(new Error('Upload connection failed')));
  child.on('close',code=>{if(code!==0)return finish(new Error('Upload failed'));try{const result=JSON.parse(output);if(result.protocol!=='art-des-deploy-v2'||result.state!=='uploaded'||result.targetSha!==sha||result.artifactSha256!==artifactHash||result.bytes!==bytes)throw new Error();finish();}catch{finish(new Error('Upload identity mismatch'));}});
  progress();source.pipe(child.stdin);
 });
}
export async function verifyPublishedSite({baseUrl,codeSha,contentHash,snapshot,fetchImpl=fetch,timeoutMs=120000,requestTimeoutMs=15000}){
 if(!shaPattern.test(codeSha)||!hashPattern.test(contentHash)||!snapshot?.projects?.length||!Array.isArray(snapshot.assets))throw new Error('Invalid public verification input');
 const base=new URL(baseUrl);if(base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw new Error('Invalid public origin');
 const expires=Date.now()+timeoutMs;
 async function read(name){
  const remaining=Math.min(requestTimeoutMs,expires-Date.now());if(remaining<=0)throw new Error('Public verification deadline exceeded');
  const controller=new AbortController();let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Public verification deadline exceeded'));},remaining);});
  try{return await Promise.race([(async()=>{const response=await fetchImpl(new URL(name,base),{signal:controller.signal,redirect:'error',cache:'no-store'});if(response.status!==200)throw new Error('Published route unavailable');const chunks=[];let size=0;const reader=response.body?.getReader();if(reader){for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>20*1024*1024){await reader.cancel();throw new Error('Public response exceeds limit');}chunks.push(Buffer.from(value));}}return Buffer.concat(chunks);})(),deadline]);}finally{clearTimeout(timer);controller.abort();}
 }
 const mark=bytes=>{const html=bytes.toString('utf8');if(!html.includes(`data-build-sha="${codeSha}"`)||!html.includes(`data-content-sha256="${contentHash}"`))throw new Error('Published code/content identity mismatch');};
 mark(await read('/'));
 for(const project of snapshot.projects)mark(await read('/projects/'+project.slug));
 for(const asset of snapshot.assets){const bytes=await read(asset.publicPath);if(bytes.length!==asset.size||createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error('Published asset identity mismatch');}
 return {verified:true,codeSha,contentHash};
}
