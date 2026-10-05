import type {Payload} from 'payload'
import type {User} from '../payload-types'
import path from 'node:path'
import {mkdir,lstat,readFile,writeFile,rm,rename} from 'node:fs/promises'
import {execFile,spawn,type ChildProcess} from 'node:child_process'
import {promisify} from 'node:util'
import {OperationStore,type PublicationOperation} from './operations'
import {exportPayloadPublished} from '../release-export'
import {writeSnapshotDirectory} from '../../../portfolio-release/snapshot-directory.mjs'
import {contentHash} from '../../../portfolio-release/content-source.mjs'
const exec=promisify(execFile)
export async function beginPreparation({payload,user,dataRoot,repoRoot,requestId}:{payload:Payload;user:User;dataRoot:string;repoRoot:string;requestId:string}){
 const store=new OperationStore(dataRoot),replay=await store.forRequest(requestId,user.id)
 if(replay)return replay
 const {stdout:head}=await exec('git',['rev-parse','HEAD'],{cwd:repoRoot,timeout:10000})
 const {stdout:status}=await exec('git',['status','--porcelain','--untracked-files=normal','--','.',':!USERSPACE'],{cwd:repoRoot,timeout:10000})
 if(status.trim())throw new Error('Подготовка требует сохранённой чистой версии кода.')
 const prepared=await exportPayloadPublished({payload,user,dataRoot})
 const hash=contentHash(Buffer.from(JSON.stringify(prepared.snapshot)+'\n'))
 const operation=await store.create({requestId,owner:user.id,codeSha:head.trim(),contentHash:hash})
 return dispatchPreparation({store,operation,dataRoot,repoRoot,writeSnapshot:snapshot=>writeSnapshotDirectory(snapshot,prepared)})
}
export async function dispatchPreparation({store,operation,dataRoot,repoRoot,writeSnapshot}:{store:OperationStore;operation:PublicationOperation;dataRoot:string;repoRoot:string;writeSnapshot:(destination:string)=>Promise<unknown>}){
 const owner=operation.owner
 if(operation.state!=='preparing')return operation
 const inputs=path.join(store.root,'inputs'),directory=path.join(inputs,operation.id),dispatch=path.join(directory,'dispatch-lock')
 let child:ChildProcess|undefined,dispatched=false
 try{
  await mkdir(inputs,{recursive:true,mode:0o700});if((await lstat(inputs)).isSymbolicLink())throw new Error('Publication inputs symlink')
  await mkdir(directory,{recursive:true,mode:0o700});if((await lstat(directory)).isSymbolicLink())throw new Error('Publication input symlink')
  try{await mkdir(dispatch);dispatched=true}catch(error){if((error as NodeJS.ErrnoException).code==='EEXIST')return store.read(operation.id,owner);throw error}
  const snapshot=path.join(directory,'snapshot')
  try{const bytes=await readFile(path.join(snapshot,'snapshot.json'));if(contentHash(bytes)!==operation.contentHash)throw new Error('Frozen snapshot changed')}
  catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;await writeSnapshot(snapshot)}
  const appRoot=path.join(repoRoot,'tools/payload-admin'),env:NodeJS.ProcessEnv={...process.env,PAYLOAD_LOCAL_ROOT:dataRoot}
  delete env.PAYLOAD_SECRET
  child=spawn(process.execPath,['--import','tsx','scripts/publication-worker.ts','prepare',operation.id,String(owner)],{cwd:appRoot,env,detached:true,stdio:'ignore'})
  child.once('exit',async code=>{try{const current=await store.read(operation.id,owner);if(code!==0&&current.state==='preparing')await store.transition(operation.id,owner,'preparing','failed',{errorCode:'PREPARATION_FAILED'});await rm(dispatch,{recursive:true})}catch{/* Durable state remains authoritative after parent shutdown. */}})
  await new Promise<void>((resolve,reject)=>{child!.once('spawn',resolve);child!.once('error',reject)})
  const workerFile=path.join(directory,'worker-'+operation.id+'.part')
  await writeFile(workerFile,JSON.stringify({version:1,pid:child.pid,action:'prepare',operationId:operation.id,startedAt:new Date().toISOString()}),{mode:0o600,flag:'wx'})
  await rename(workerFile,path.join(directory,'worker.json'))
  child.unref()
  return operation
 }catch{
  if(child?.pid&&child.exitCode===null&&child.signalCode===null){const stopped=new Promise<void>(resolve=>{child!.once('exit',()=>resolve());child!.once('error',()=>resolve())});child.kill('SIGTERM');await stopped}
  const current=await store.read(operation.id,owner);if(current.state==='preparing')await store.transition(operation.id,owner,'preparing','failed',{errorCode:'SNAPSHOT_FAILED'})
  if(dispatched)await rm(dispatch,{recursive:true})
  throw new Error('Не удалось запустить подготовку выпуска. Действующий сайт сохранён.')
 }
}
