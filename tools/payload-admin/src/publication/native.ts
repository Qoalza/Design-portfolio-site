import {createHash} from 'node:crypto'
import {createLocalReq,commitTransaction,killTransaction,restoreVersionOperation,type Payload,type PayloadRequest} from 'payload'
import type {Project,User} from '../payload-types'
import {prepareReleaseRecords,releaseProjectDocument} from '../release-export'
import {canonicalJSON} from '../../../portfolio-delivery/contract.mjs'
import {PublicationError,type NativeState,type NativePublicationAdapter,type PublicationIntent,type PublicationJournal,type NativeCommit} from '../../../portfolio-delivery/coordinator.mjs'
import {authorizePublication} from './guard'

const digest=(value:unknown)=>createHash('sha256').update(canonicalJSON(value)).digest('hex')
// IDs and timestamps identify the native revision separately from author values.
// depth:0 ensures upload relationships are stable IDs, not mutable URL objects.
export function authorDigest(record:Project) {
 const values={...record} as Record<string,unknown>
 for(const key of ['id','createdAt','updatedAt','_status'])delete values[key]
 return digest(values)
}
export function createNativePublicationAdapter({payload,user,dataRoot}:{payload:Payload;user:User;dataRoot:string}):NativePublicationAdapter & {
 inspect(target:string,req?:PayloadRequest):Promise<{record:Project;state:NativeState;versionId:string}|null>;
 selectVersion(id:string,target:string):Promise<Project>;
} {
 async function request() {return createLocalReq({user},payload)}
 async function inspect(target:string,req?:PayloadRequest) {
  req??=await request()
  const found=await payload.find({collection:'projects',req,overrideAccess:false,draft:true,depth:0,limit:1,where:{id:{equals:Number(target)}}})
  const record=found.docs[0];if(!record)return null
  const versions=await payload.findVersions({collection:'projects',req,overrideAccess:false,depth:0,limit:1,sort:'-id',where:{parent:{equals:Number(target)}}})
  const version=versions.docs[0],versionId=version?String(version.id):'none'
  const sourceDigest=authorDigest(record)
  return {record,versionId,state:{digest:sourceDigest,revision:digest({record,versionId})}}
 }
 async function selectVersion(id:string,target:string,req?:PayloadRequest) {
  req??=await request()
  const selected=await payload.findVersionByID({collection:'projects',id,req,overrideAccess:false,depth:0})
  const parent=selected.parent
  if(String(parent)!==target||!['published','draft'].includes(String(selected.version._status)))throw new PublicationError('invalid-selected-version')
  return {...selected.version,id:Number(target)} as Project
 }
 async function selected(intent:PublicationIntent,req?:PayloadRequest) {
  const current=await inspect(intent.target,req)
  if(!current||current.state.revision!==intent.expectedRevision)throw new PublicationError('stale-revision')
  const record=intent.operation==='restore'?await selectVersion(intent.selectedVersionId!,intent.target,req):current.record
  if(authorDigest(record)!==intent.sourceDigest)throw new PublicationError('source-conflict')
  return {record,current,selectedRevision:intent.operation==='restore'?intent.selectedVersionId!:current.versionId}
 }
 async function delivery(record:Project) {
  const prepared=await prepareReleaseRecords({payload,user,dataRoot,records:[record]})
  return {project:prepared.projects[0],assets:prepared.assets,externalDependencies:[...new Set(record.releaseExternalDependencies?.map(item=>item.url)??[])]}
 }
 async function verifyCommitted(journal:PublicationJournal) {
  if(!journal.committed)throw new PublicationError('commit-uncertain')
  const now=await inspect(journal.intent.target)
  if(canonicalJSON(now?.state??null)!==canonicalJSON(journal.committed.current))throw new PublicationError('stale-revision')
  if(!['publish','restore'].includes(journal.intent.operation))return {}
  // Journal stores the exact committed target only, not an export of the CMS.
  // Its fingerprint is checked before expensive bytes are prepared again.
  const source=journal.committed.source as Project|undefined
  if(!source||!now||authorDigest(source)!==now.state.digest)throw new PublicationError('invalid-committed-source')
  return journal.intent.operation==='restore'&&source._status==='draft'?{effect:'remove' as const}:delivery(source)
 }
 return {
  inspect,selectVersion,
  current:async intent=>(await inspect(intent.target))?.state??null,
  prepare:async intent=>{
   const value=await selected(intent)
   return {...(intent.operation==='restore'&&value.record._status==='draft'?{effect:'remove' as const}:['publish','restore'].includes(intent.operation)?await delivery(value.record):{}),sourceDigest:intent.sourceDigest,selectedRevision:value.selectedRevision}
  },
  commit:async(intent,source,checkpoint)=>{
   const req=await request()
   // Hold SQLite only around source recheck/native mutation/actual commit. The
   // expensive decoding and filesystem preparation already completed outside.
   const transaction=await payload.db.beginTransaction()
   if(!transaction)throw new PublicationError('transaction-unavailable')
   req.transactionID=transaction
   let revoke:undefined|(()=>boolean)
   try {
    const value=await selected(intent,req)
    if(value.selectedRevision!==source.selectedRevision)throw new PublicationError('stale-revision')
    revoke=authorizePublication(req,intent,source)
    let record:Project|undefined
    if(intent.operation==='delete')record=await payload.delete({collection:'projects',id:Number(intent.target),req,overrideAccess:false,overrideLock:false,depth:0})
    else if(intent.operation==='restore')record=await restoreVersionOperation<Project>({collection:payload.collections.projects,id:Number(intent.selectedVersionId),req,overrideAccess:false,draft:false,depth:0})
    else record=await payload.update({collection:'projects',id:Number(intent.target),req,overrideAccess:false,overrideLock:false,depth:0,unpublishAllLocales:intent.operation==='unpublish',data:{_status:intent.operation==='publish'?'published':'draft'}})
    const committed=await inspect(intent.target,req)
    const result:NativeCommit={current:committed?.state??null,revision:committed?.versionId??'deleted',...(record?{source:committed?.record??record}:{})}
    if((intent.operation==='publish'||(intent.operation==='restore'&&value.record._status==='published'))&&(!committed||canonicalJSON(releaseProjectDocument(committed.record))!==canonicalJSON(releaseProjectDocument(value.record))))throw new PublicationError('commit-source-differs')
    await checkpoint?.(result)
    await commitTransaction(req)
    // The installed Drizzle commit helper can swallow a commit rejection. Never
    // equate its resolved promise with durability: re-read using a fresh request
    // outside that transaction and verify the exact committed version/result.
    const actual=(await inspect(intent.target))?.state??null
    if(canonicalJSON(actual)!==canonicalJSON(result.current))throw new PublicationError('commit-not-confirmed')
    return result
   }catch(error){await killTransaction(req);throw error}
   finally{revoke?.()}
  },
  delivery:verifyCommitted,
  recover:async journal=>{
   // The coordinator flushed the actual native result (including a new version
   // ID and full record fingerprint) before committing SQLite. This checkpoint
   // alone is not a receipt: compare the actual database after restart first.
   const current=(await inspect(journal.intent.target))?.state??null
   if(journal.nativePrepared&&canonicalJSON(current)===canonicalJSON(journal.nativePrepared.current))return {state:'committed',result:journal.nativePrepared}
   if(current?.revision===journal.intent.expectedRevision)return {state:'uncommitted'}
   return {state:'ambiguous'}
  },
 }
}
