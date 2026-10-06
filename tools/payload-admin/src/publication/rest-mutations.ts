import {randomUUID} from 'node:crypto'
import {PublicationError,type PublicationKind} from '../../../portfolio-delivery/coordinator.mjs'
import {authenticatedPublication,publicationFailure,boundedPublicationJSON} from './http'
import {publicationRuntime} from './runtime'
import {authorDigest} from './native'
import {nativeSelection} from './selection'
import type {Where} from 'payload'

export async function bridgeNativeMutation(request:Request,slug:string[]|undefined):Promise<Response|null> {
 if(slug?.[0]!=='projects')return null
 const url=new URL(request.url),restore=request.method==='POST'&&slug.length===3&&slug[1]==='versions'
 const remove=request.method==='DELETE'&&(slug.length===1||slug.length===2)
 let operation:PublicationKind|undefined=restore?'restore':remove?'delete':undefined
 // Exact native publication status actions only. Bulk draft field edits and
 // arbitrary full documents retain the native path and publication guard.
 if(request.method==='PATCH'&&slug.length<=2&&request.headers.get('content-type')?.startsWith('application/json')) {
  // Authenticate before examining an action body. Classification is bounded;
  // larger native draft documents continue through native validation/guards.
  try {await authenticatedPublication(request,true)}catch(error){return publicationFailure(error)}
  const body=await boundedPublicationJSON(request.clone()).catch(()=>null)
  if(body&&Object.keys(body).length===1&&body._status==='published'&&slug.length===1)operation='publish'
  if(body&&Object.keys(body).length===1&&body._status==='draft'&&url.searchParams.get('draft')!=='true')operation='unpublish'
 }
 if(!operation||(restore&&url.searchParams.get('draft')==='true'))return null
 try {
  const {payload,user}=await authenticatedPublication(request,true),runtime=await publicationRuntime(payload,user)
  const {coordinator,native}=runtime,actor=String(user.id),selectedVersionId=restore?slug[2]:undefined,bulk=!restore&&slug.length===1
  let ids:string[],where:Where|undefined
  if(bulk){const selection=nativeSelection(url.searchParams);ids=selection.ids;where=selection.where}
  else ids=[restore?'':slug[1]]
  const docs:unknown[]=[],errors:Array<{id:string;message:string;operationId?:string}>=[],operations=[]
  for(const id of ids) {
   try {
    if((selectedVersionId&&!/^[1-9]\d{0,15}$/.test(selectedVersionId))||(!restore&&!/^[1-9]\d{0,15}$/.test(id)))throw new PublicationError('invalid-intent')
    let intent=await coordinator.nativeReplay({actor,operation,target:restore?undefined:id,selectedVersionId})
    if(!intent) {
     let target=id
     if(restore) {
      const version=await payload.findVersionByID({collection:'projects',id:selectedVersionId!,user,overrideAccess:false,depth:0})
      target=String(version.parent)
     }
     if(where) {
      const matched=await payload.find({collection:'projects',user,overrideAccess:false,draft:true,depth:0,limit:1,where:{and:[where,{id:{equals:Number(target)}}]}})
      if(!matched.docs.length)throw new PublicationError('selected-project-changed')
     }
     const current=await native.inspect(target)
     if(!current)throw new PublicationError('stale-revision')
     const chosen=restore?await native.selectVersion(selectedVersionId!,target):current.record
     intent={operationId:randomUUID(),actor,target,operation,expectedRevision:current.state.revision,sourceDigest:authorDigest(chosen),...(selectedVersionId?{selectedVersionId}:{})}
    }
    const status=await coordinator.execute(intent);operations.push(status)
    if(status.status!=='delivered') {errors.push({id:intent.target,operationId:status.operationId,message:'Доставка на сайт не подтверждена. Повторите доставку в списке операций.'});continue}
    docs.push(await coordinator.nativeResult(intent.operationId,actor))
   }catch(error) {if(!bulk)throw error;errors.push({id,message:error instanceof PublicationError?error.code:'Изменение не применено.'})}
  }
  const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'}
  if(bulk)return Response.json({docs,errors,totalDocs:ids.length,publications:operations,message:errors.length?'Часть изменений не доставлена на сайт.':'Выбранные изменения применены на сайте.'},{status:errors.length?400:200,headers})
  if(errors.length)return Response.json({errors,publication:operations[0]},{status:409,headers})
  const source=docs[0],publication=operations[0]
  return Response.json(restore?{...(source as Record<string,unknown>),message:'Версия восстановлена; изменение применено на сайте.',publication}:{doc:source,message:operation==='delete'?'Проект удалён; изменение применено на сайте.':'Изменение применено на сайте.',publication},{headers})
 }catch(error){return publicationFailure(error)}
}
