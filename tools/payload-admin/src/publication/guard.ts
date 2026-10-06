import {APIError,type PayloadRequest,type CollectionBeforeOperationHook,type CollectionBeforeDeleteHook} from 'payload'
import type {PublicationIntent,NativeSource} from '../../../portfolio-delivery/coordinator.mjs'
// The authority is request object identity. req.context and browser JSON cannot
// manufacture it. Local API operations preserve this same request object.
const trusted=new WeakMap<PayloadRequest,{intent:PublicationIntent;source:NativeSource}>()
const drafts=new WeakSet<PayloadRequest>()
export function authorizePublication(req:PayloadRequest,intent:PublicationIntent,source:NativeSource) {
 if(!req.user||String(req.user.id)!==intent.actor||req.payloadAPI!=='local')throw new APIError('Необходимо войти в админку.',401)
 trusted.set(req,{intent,source})
 return ()=>trusted.delete(req)
}
// Native restoreVersion passes a locale-validation clone whose prototype is the
// original request. Preserve authority only along that server-created lineage.
function lineage<T>(req:PayloadRequest,get:(request:PayloadRequest)=>T|undefined):T|undefined {
 let current:PayloadRequest|null=req
 for(let depth=0;current&&depth<16;depth++,current=Object.getPrototypeOf(current)) {const found=get(current);if(found!==undefined)return found}
}
export const nativeDraftOperation=(req:PayloadRequest)=>Boolean(lineage(req,request=>drafts.has(request)?true:undefined))
export const prevalidatedPublication=(req:PayloadRequest)=>Boolean(lineage(req,request=>trusted.get(request)))
export const guardProjectPublication:CollectionBeforeOperationHook<'projects'>=({operation,args,req})=>{
 if(!['create','update','delete','restoreVersion'].includes(operation))return
 const requestedDraft='draft' in args && args.draft===true
 // Payload treats draft=true + _status=published as a native publish. Only
 // restore's draft flag unconditionally forces its final status back to draft.
 const draft=requestedDraft&&(operation==='restoreVersion'||!('data' in args)||args.data?._status!=='published')
 drafts.delete(req)
 if(draft&&operation!=='delete'){drafts.add(req);return args}
 const authority=trusted.get(req)
 if(authority) {
  const {intent}=authority
  const id='id' in args?String(args.id):''
  const permitted=intent.operation==='delete'?operation==='delete'&&id===intent.target:
   intent.operation==='restore'?operation==='restoreVersion'&&id===intent.selectedVersionId:
   operation==='update'&&id===intent.target&&'data' in args&&args.data?._status===(intent.operation==='publish'?'published':'draft')
  if(permitted)return args
 }
 // New explicit draft create has no public effect, even without draft query.
 if(operation==='create'&&'data' in args&&args.data?._status==='draft'){drafts.add(req);return args}
 throw new APIError('Изменение сайта доступно только через подтверждённую публикацию.',409)
}
export const guardProjectDelete:CollectionBeforeDeleteHook=({id,req})=>{
 const authority=trusted.get(req)
 if(!authority||authority.intent.operation!=='delete'||authority.intent.target!==String(id))throw new APIError('Удаление проекта требует подтверждённой доставки на сайт.',409)
}
