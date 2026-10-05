import {mkdir,readFile,lstat,rm} from 'node:fs/promises'
import path from 'node:path'
import {runCommand as exec,UnstoppedCommandError} from './command'
import {OperationStore} from './operations'
import {readSnapshotDirectory} from '../../../portfolio-release/snapshot-directory.mjs'
import {contentHash} from '../../../portfolio-release/content-source.mjs'
export async function prepareRuntime({dataRoot,repoRoot,id,owner}:{dataRoot:string;repoRoot:string;id:string;owner:number}) {
 const store=new OperationStore(dataRoot),operation=await store.read(id,owner)
 if(operation.state!=='preparing')return operation
 const directory=path.join(store.root,'inputs',operation.id),snapshot=path.join(directory,'snapshot'),checkout=path.join(directory,'build')
 await mkdir(path.join(store.root,'inputs'),{recursive:true,mode:0o700})
 if((await lstat(path.join(store.root,'inputs'))).isSymbolicLink())throw new Error('Publication input root symlink')
 await mkdir(directory,{recursive:true,mode:0o700});if((await lstat(directory)).isSymbolicLink())throw new Error('Publication input symlink')
 const lock=path.join(directory,'prepare-lock')
 try{await mkdir(lock)}catch(error){if((error as NodeJS.ErrnoException).code==='EEXIST')return store.read(id,owner);throw error}
 let added=false,retainCheckout=false
 const env:NodeJS.ProcessEnv={...process.env,PORTFOLIO_RELEASE_CONTENT:'payload-published',PORTFOLIO_PROJECT_SNAPSHOT:snapshot,PORTFOLIO_RELEASE_SNAPSHOT_SHA256:operation.contentHash,NEXT_TELEMETRY_DISABLED:'1'}
 delete env.PAYLOAD_SECRET;delete env.PAYLOAD_LOCAL_ROOT
 try{
  const bytes=await readFile(path.join(snapshot,'snapshot.json'))
  if(contentHash(bytes)!==operation.contentHash)throw new Error('Frozen publication snapshot changed')
  const prepared=await readSnapshotDirectory(snapshot)
  if(prepared.provenance.origin!=='payload-published')throw new Error('Published native content required')
  // A clean detached checkout contains only exact code. No current dirty files,
  // Admin data, personal state or user-only area are copied into the build.
  await exec('git',['worktree','add','--detach',checkout,operation.codeSha],{cwd:repoRoot,timeout:30000,maxBuffer:1024*1024});added=true
  for(const cwd of [checkout,path.join(checkout,'tools/concept-v2/app')])await exec('npm',['ci','--offline','--ignore-scripts','--no-audit','--no-fund'],{cwd,env,timeout:180000,maxBuffer:2*1024*1024})
  await exec('npm',['run','build'],{cwd:checkout,env,timeout:300000,maxBuffer:4*1024*1024})
  const archive=path.join(directory,'runtime.tar.gz')
  const {stdout}=await exec(process.execPath,['tools/portfolio-release/package-runtime.mjs',archive],{cwd:checkout,env,timeout:120000,maxBuffer:16384})
  const result=JSON.parse(stdout) as {sha:string;contentHash:string;contentOrigin:string;artifactSha256:string;bytes:number}
  if(result.sha!==operation.codeSha||result.contentHash!==operation.contentHash||result.contentOrigin!=='payload-published')throw new Error('Prepared publication identity mismatch')
  await exec('git',['worktree','remove','--force',checkout],{cwd:repoRoot,timeout:30000,maxBuffer:1024*1024});added=false
  return await store.transition(id,owner,'preparing','ready',{artifactHash:result.artifactSha256,archiveBytes:result.bytes})
 }catch(error){
  retainCheckout=error instanceof UnstoppedCommandError
  const current=await store.read(id,owner)
  if(current.state==='preparing')await store.transition(id,owner,'preparing','failed',{errorCode:'PREPARATION_FAILED'})
  throw new Error('Не удалось подготовить выпуск. Опубликованные данные и действующий сайт сохранены.')
 }finally{
  try{if(added&&!retainCheckout)await exec('git',['worktree','remove','--force',checkout],{cwd:repoRoot,timeout:30000,maxBuffer:1024*1024})}finally{await rm(lock,{recursive:true})}
 }
}
