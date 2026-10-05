import {randomUUID} from 'node:crypto'
import {mkdir,readFile,writeFile,rename,lstat,rmdir} from 'node:fs/promises'
import path from 'node:path'
export type PublicationState='preparing'|'ready'|'uploading'|'starting'|'deploying'|'verifying'|'complete'|'failed'|'unknown'
export type PublicationOperation={version:1;id:string;requestId:string;owner:number;state:PublicationState;codeSha:string;contentHash:string;createdAt:string;updatedAt:string;artifactHash?:string;archiveBytes?:number;serverOperationId?:string;errorCode?:string}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
const digest=/^[a-f0-9]{64}$/
const edges:Record<PublicationState,PublicationState[]>={preparing:['ready','failed'],ready:['uploading','failed'],uploading:['starting','failed','unknown'],starting:['deploying','unknown','failed'],deploying:['verifying','unknown','failed'],verifying:['complete','unknown','failed'],complete:[],failed:[],unknown:['deploying','verifying','complete','failed']}
export function validateOperation(value:unknown):PublicationOperation{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid publication operation')
 const item=value as PublicationOperation
 if(item.version!==1||!uuid.test(item.id)||!uuid.test(item.requestId)||!Number.isSafeInteger(item.owner)||item.owner<1||!Object.hasOwn(edges,item.state)||!/^[a-f0-9]{40}$/.test(item.codeSha)||!digest.test(item.contentHash)||typeof item.createdAt!=='string'||typeof item.updatedAt!=='string'||!Number.isFinite(Date.parse(item.createdAt))||!Number.isFinite(Date.parse(item.updatedAt)))throw new Error('Invalid publication operation')
 if(item.artifactHash!==undefined&&!digest.test(item.artifactHash))throw new Error('Invalid archive identity')
 if(item.archiveBytes!==undefined&&(!Number.isSafeInteger(item.archiveBytes)||item.archiveBytes<1||item.archiveBytes>75*1024*1024))throw new Error('Invalid archive size')
 if(item.serverOperationId!==undefined&&item.serverOperationId!==`${item.codeSha}-${item.artifactHash?.slice(0,16)}`)throw new Error('Invalid server operation identity')
 if(item.errorCode!==undefined&&!/^[A-Z_]{1,64}$/.test(item.errorCode))throw new Error('Invalid operation error code')
 if(!['preparing','failed'].includes(item.state)&&(!item.artifactHash||!item.archiveBytes))throw new Error('Prepared archive required')
 const keys=['version','id','requestId','owner','state','codeSha','contentHash','createdAt','updatedAt','artifactHash','archiveBytes','serverOperationId','errorCode']
 if(Object.keys(item).some(key=>!keys.includes(key)))throw new Error('Unknown operation field')
 return {...item}
}
export class OperationStore{
 readonly root:string
 constructor(dataRoot:string){this.root=path.join(dataRoot,'site-publication')}
 private async initialize(){await mkdir(this.root,{recursive:true,mode:0o700});if((await lstat(this.root)).isSymbolicLink())throw new Error('Publication store symlink');await mkdir(path.join(this.root,'operations'),{recursive:true,mode:0o700});if((await lstat(path.join(this.root,'operations'))).isSymbolicLink())throw new Error('Publication operations symlink')}
 private requestFile(requestId:string,owner:number){if(!uuid.test(requestId)||!Number.isSafeInteger(owner)||owner<1)throw new Error('Invalid request identity');return path.join(this.root,`request-${owner}-${requestId}`)}
 private async previousRequest(requestId:string,owner:number){try{return this.read(await readFile(this.requestFile(requestId,owner),'utf8'),owner)}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error}}
 private file(id:string){if(!uuid.test(id))throw new Error('Invalid operation id');return path.join(this.root,'operations',id+'.json')}
 async read(id:string,owner:number){await this.initialize();const file=this.file(id);if((await lstat(file)).isSymbolicLink())throw new Error('Publication operation symlink');const operation=validateOperation(JSON.parse(await readFile(file,'utf8')));if(operation.owner!==owner)throw new Error('Publication operation unavailable');return operation}
 async active(owner:number){await this.initialize();let id:string;try{id=await readFile(path.join(this.root,'active'),'utf8')}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error}return this.read(id,owner)}
 async create({requestId,owner,codeSha,contentHash}:{requestId:string;owner:number;codeSha:string;contentHash:string}){
  await this.initialize();const prior=await this.previousRequest(requestId,owner)
  if(prior){if(prior.codeSha!==codeSha||prior.contentHash!==contentHash)throw new Error('Idempotency key content changed');return prior}
  const active=await this.active(owner)
  if(active){if(active.requestId===requestId){if(active.codeSha!==codeSha||active.contentHash!==contentHash)throw new Error('Idempotency key content changed');return active}if(!['complete','failed'].includes(active.state))throw new Error('Publication already active')}
  const now=new Date().toISOString(),operation=validateOperation({version:1,id:randomUUID(),requestId,owner,codeSha,contentHash,state:'preparing',createdAt:now,updatedAt:now})
  // One process-independent reservation. Terminal active state is replaced only
  // under this short exclusive lock. A stale lock never authorizes a new deploy.
  const lock=path.join(this.root,'reservation');await mkdir(lock)
  try {
   const replay=await this.previousRequest(requestId,owner)
   if(replay){if(replay.codeSha!==codeSha||replay.contentHash!==contentHash)throw new Error('Idempotency key content changed');return replay}
   const current=await this.active(owner)
   if(current){if(current.requestId===requestId){if(current.contentHash!==contentHash||current.codeSha!==codeSha)throw new Error('Idempotency key content changed');return current}if(!['complete','failed'].includes(current.state))throw new Error('Publication already active')}
   await writeFile(this.file(operation.id),JSON.stringify(operation),{flag:'wx',mode:0o600})
   await writeFile(this.requestFile(requestId,owner),operation.id,{flag:'wx',mode:0o600})
   const pointer=path.join(this.root,'active-'+operation.id);await writeFile(pointer,operation.id,{flag:'wx',mode:0o600});await rename(pointer,path.join(this.root,'active'))
   return operation
  }finally{await rmdir(lock)}
 }
 async transition(id:string,owner:number,expected:PublicationState,next:PublicationState,patch:Partial<Pick<PublicationOperation,'artifactHash'|'archiveBytes'|'serverOperationId'|'errorCode'>>={}){
  await this.initialize();const lock=this.file(id)+'.lock';await mkdir(lock)
  try{const previous=await this.read(id,owner);if(previous.state!==expected||!edges[expected].includes(next))throw new Error('Publication state conflict');if((previous.artifactHash&&patch.artifactHash&&previous.artifactHash!==patch.artifactHash)||(previous.archiveBytes&&patch.archiveBytes&&previous.archiveBytes!==patch.archiveBytes))throw new Error('Publication archive identity is immutable');const operation=validateOperation({...previous,...patch,state:next,updatedAt:new Date().toISOString(),...(!['unknown','failed'].includes(next)?{errorCode:undefined}:{})});const temporary=this.file(id)+'.'+randomUUID()+'.part';await writeFile(temporary,JSON.stringify(operation),{flag:'wx',mode:0o600});await rename(temporary,this.file(id));return operation}finally{await rmdir(lock)}
 }
}
