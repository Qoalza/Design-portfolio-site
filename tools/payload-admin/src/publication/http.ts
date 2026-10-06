import config from '@payload-config'
import {getPayload,APIError} from 'payload'
import {runtimeSettings} from '../../scripts/runtime-settings.mjs'
import {publicationRuntime} from './runtime'
import {createNativePublicationAdapter} from './native'
import {PublicationError,validateIntent,type PublicationStatus} from '../../../portfolio-delivery/coordinator.mjs'
import {exactObject} from '../../../portfolio-delivery/contract.mjs'
import type {User} from '../payload-types'
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'}
export async function authenticatedPublication(request:Request,write=false) {
 const settings=runtimeSettings()
 if(request.headers.get('host')!==new URL(settings.origin).host||(write&&request.headers.get('origin')!==settings.origin))throw new APIError('Запрос недоступен.',403)
 const payload=await getPayload({config}),auth=await payload.auth({headers:request.headers})
 if(!auth.user)throw new APIError('Необходимо войти в админку.',401)
 return {payload,user:auth.user as User,settings}
}
export function publicationFailure(error:unknown) {
 const status=error instanceof APIError?error.status:error instanceof PublicationError?(error.code==='operation-not-found'?404:409):503
 return Response.json({error:error instanceof PublicationError?error.code:'publication-unavailable',message:status===401?'Необходимо войти в админку.':status===403?'Запрос недоступен.':'Публикация не подтверждена. Проверьте состояние операции и повторите доставку.'},{status,headers})
}
export function statusResponse(status:PublicationStatus) {
 const delivered=status.status==='delivered',waiting=['pending','committing','activating'].includes(status.status)
 return Response.json({...status,message:delivered?'Изменение применено на сайте.':waiting?(status.status==='committing'?'Результат изменения в админке ещё не подтверждён. Проверьте операцию и повторите доставку.':'Доставка изменения на сайт ещё не подтверждена.'):'Изменение не применено. Проверьте ревизию и материалы проекта.'},{status:delivered?200:waiting?202:409,headers})
}
export async function publicationGET(request:Request) {
 try {
  const {payload,user}=await authenticatedPublication(request),runtime=await publicationRuntime(payload,user)
  const url=new URL(request.url),target=url.searchParams.get('target')??undefined
  if(target&&!/^[1-9]\d{0,15}$/.test(target))throw new PublicationError('invalid-intent')
  const active=await runtime.coordinator.active(),operations=await runtime.coordinator.status({target}),own=new Set((await runtime.coordinator.status({actor:String(user.id),target})).map(item=>item.operationId))
  const record=target?await runtime.native.inspect(target):null
  return Response.json({operations:operations.slice(0,50).map(item=>({...item,canRetry:own.has(item.operationId)&&['pending','committing','activating','failed'].includes(item.status)})),active:active.descriptor,published:target?active.state.projects.some(item=>item.target===target):undefined,...(record?{saved:{target,expectedRevision:record.state.revision,sourceDigest:record.state.digest}}:{})},{headers})
 }catch(error){return publicationFailure(error)}
}
export async function publicationPOST(request:Request) {
 try {
  const {payload,user}=await authenticatedPublication(request,true),runtime=await publicationRuntime(payload,user)
  const data=await boundedPublicationJSON(request)
  if(data?.retryOperationId!==undefined) {
   exactObject(data,['retryOperationId'],'Publication retry')
   if(typeof data.retryOperationId!=='string')throw new PublicationError('invalid-intent')
   return statusResponse(await runtime.coordinator.retry(data.retryOperationId,String(user.id)))
  }
  exactObject(data,['operationId','target','operation','expectedRevision','sourceDigest','selectedVersionId'],'Publication request')
  const intent=validateIntent({...data,actor:String(user.id)})
  return statusResponse(await runtime.coordinator.execute(intent))
 }catch(error){return publicationFailure(error)}
}
// Readonly native helper used by the REST save wrapper without requiring an
// initialized published projection. Draft editing remains available separately.
export async function authenticatedNative(request:Request) {
 const {payload,user,settings}=await authenticatedPublication(request,true)
 return {payload,user,native:createNativePublicationAdapter({payload,user,dataRoot:settings.root})}
}

export async function boundedPublicationJSON(request:Request):Promise<Record<string,unknown>> {
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new PublicationError('invalid-intent')
 const declared=request.headers.get('content-length')
 if(declared&&(!/^\d+$/.test(declared)||Number(declared)>16384))throw new PublicationError('invalid-intent')
 const stream=request.body?.getReader();if(!stream)throw new PublicationError('invalid-intent')
 let size=0;const chunks:Uint8Array[]=[]
 try {for(;;){const next=await stream.read();if(next.done)break;size+=next.value.byteLength;if(size>16384){await stream.cancel();throw new PublicationError('invalid-intent')}chunks.push(next.value)}}finally{stream.releaseLock()}
 const value:unknown=JSON.parse(Buffer.concat(chunks).toString('utf8'))
 if(!value||typeof value!=='object'||Array.isArray(value))throw new PublicationError('invalid-intent')
 return value as Record<string,unknown>
}
