import {randomUUID} from 'node:crypto'
import {APIError,type PayloadRequest,type CollectionAfterOperationHook} from 'payload'
import {nativeDraftOperation} from './guard'
import type {NativeState} from '../../../portfolio-delivery/coordinator.mjs'
const header='x-payload-draft-capture'
type Captured={id:string;state:NativeState}
type Pending={actor:string;capture:(req:PayloadRequest,id:string)=>Promise<Captured>;result?:Captured}
// Shared only inside this CMS process; the nonce is injected by the server REST
// wrapper. It conveys capture identity, never public mutation authority.
const host=globalThis as typeof globalThis & {__payloadDraftCaptures?:Map<string,Pending>}
const pending=host.__payloadDraftCaptures??=new Map<string,Pending>()
export function registerDraftCapture(actor:string,capture:Pending['capture']) {
 const token=randomUUID(),entry:Pending={actor,capture}
 pending.set(token,entry)
 return {headers:(headers:Headers)=>{const result=new Headers(headers);result.set(header,token);return result},result:()=>entry.result,close:()=>pending.delete(token)}
}
export const captureSavedDraft:CollectionAfterOperationHook<'projects'>=async ({operation,req,result})=>{
 if(!['create','update','updateByID'].includes(operation)||!nativeDraftOperation(req))return result
 const token=req.headers.get(header),entry=token?pending.get(token):undefined
 if(!entry)return result
 if(!req.user||String(req.user.id)!==entry.actor)throw new APIError('Необходимо войти в админку.',401)
 if(!result||typeof result!=='object'||!('id' in result))throw new APIError('Сохранённая ревизия не определена.',409)
 entry.result=await entry.capture(req,String(result.id))
 return result
}
