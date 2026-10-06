import type {PayloadRequest} from 'payload'
import {registerDraftCapture} from './draft-capture'
import {authenticatedNative,publicationFailure} from './http'
import {canonicalJSON} from '../../../portfolio-delivery/contract.mjs'
import {PublicationError} from '../../../portfolio-delivery/coordinator.mjs'
export async function captureDraftResponse(request:Request,slug:string[]|undefined,handler:(request:Request)=>Promise<Response>):Promise<Response> {
 if(slug?.[0]!=='projects'||(slug.length!==2&&!(slug.length===1&&request.method==='POST'))||!['POST','PATCH','PUT'].includes(request.method)||new URL(request.url).searchParams.get('draft')!=='true')return handler(request)
 let capture:ReturnType<typeof registerDraftCapture>|undefined
 try {
  const {user,native}=await authenticatedNative(request)
  capture=registerDraftCapture(String(user.id),async(req:PayloadRequest,id:string)=>{
   const saved=await native.inspect(id,req)
   if(!saved)throw new PublicationError('saved-revision-unavailable')
   return {id,state:saved.state}
  })
  const response=await handler(new Request(request,{headers:capture.headers(request.headers)}))
  if(!response.ok)return response
  const result=capture.result()
  if(!result)throw new PublicationError('saved-revision-unavailable')
  // A newer revision arriving between native save and this response is a
  // conflict. Never attach its ID to the form that was just submitted.
  const current=await native.inspect(result.id)
  if(!current||canonicalJSON(current.state)!==canonicalJSON(result.state))throw new PublicationError('saved-revision-changed')
  const headers=new Headers(response.headers)
  headers.set('X-Payload-Saved-Target',result.id)
  headers.set('X-Payload-Saved-Revision',result.state.revision)
  headers.set('X-Payload-Saved-Digest',result.state.digest)
  headers.set('Cache-Control','no-store')
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers})
 }catch(error){return publicationFailure(error)}
 finally{capture?.close()}
}
