'use client'
import {useCallback,useEffect,useState} from 'react'
import {Button,ConfirmationModal,FormSubmit,PopupList,toast,useDocumentInfo,useForm,useFormModified,useModal} from '@payloadcms/ui'
import type {PublicationStatus} from '../../../portfolio-delivery/coordinator.mjs'
type Operation=PublicationStatus & {canRetry?:boolean;sequence?:number}
type State={published?:boolean;operations:Operation[];saved?:{target:string;expectedRevision:string;sourceDigest:string}}
const event='payload-publication-updated'
const changed=()=>window.dispatchEvent(new Event(event))
async function request(url:string,body?:unknown) {
 const response=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined)
 const value=await response.json()
 if(!response.ok)throw Object.assign(new Error(value.message??'Доставка недоступна.'),{code:value.error??value.code,phase:value.status,status:response.status})
 return value
}
function terminalFailure(error:unknown) {
 return error instanceof Error&&(('code' in error&&['operation-not-found','stale-revision','conflict','superseded'].includes(String(error.code)))||('phase' in error&&['conflict','superseded'].includes(String(error.phase))))
}
function useDelivery(target?:string) {
 const [state,setState]=useState<State|null>(null),[error,setError]=useState(false)
 const reload=useCallback(async()=>{try{setState(await request('/api/publications'+(target?'?target='+encodeURIComponent(target):'')));setError(false)}catch{setError(true)}},[target])
 useEffect(()=>{const initial=setTimeout(()=>void reload(),0);window.addEventListener(event,reload);return()=>{clearTimeout(initial);window.removeEventListener(event,reload)}},[reload])
 useEffect(()=>{if(!state?.operations.some(item=>['pending','committing','activating'].includes(item.status)))return;const timer=setInterval(()=>void reload(),5000);return()=>clearInterval(timer)},[state,reload])
 return {state,error,reload}
}
function deliveryToast(status:PublicationStatus & {message?:string}) {
 if(status.status==='delivered')toast.success(status.message??'Изменение применено на сайте.')
 else toast.warning(status.message??'Доставка на сайт ещё не подтверждена.')
 changed()
}
export function PublicationPublishButton() {
 const {id,collectionSlug,hasPublishPermission,hasPublishedDoc,unpublishedVersionCount,uploadStatus,setHasPublishedDoc,setUnpublishedVersionCount,setMostRecentVersionIsAutosaved}=useDocumentInfo()
 const {submit}=useForm(),modified=useFormModified()
 const [busy,setBusy]=useState(false),[pending,setPending]=useState<string|null>(null)
 const received=(status:PublicationStatus & {message?:string})=>{deliveryToast(status);if(status.status==='delivered'){setPending(null);setHasPublishedDoc(true);setUnpublishedVersionCount(0);setMostRecentVersionIsAutosaved(false)}}
 const publish=async()=>{
  if(busy||uploadStatus==='uploading')return
  setBusy(true)
  try {
   if(pending&&!modified){received(await request('/api/publications',{retryOperationId:pending}));return}
   // Native form submission owns validation/onSuccess/updated fields. The exact
   // saved revision is captured by the server before commit and confirmed after.
   const saved=await submit({action:`/api/${collectionSlug}${id?'/'+id:''}?draft=true&depth=0`,method:id?'PATCH':'POST',overrides:{_status:'draft'},skipValidation:true,disableSuccessStatus:true})
   if(!saved||!saved.res.ok)return
   const target=saved.res.headers.get('X-Payload-Saved-Target'),expectedRevision=saved.res.headers.get('X-Payload-Saved-Revision'),sourceDigest=saved.res.headers.get('X-Payload-Saved-Digest')
   if(!target||!expectedRevision||!sourceDigest)throw new Error('Точная сохранённая ревизия не подтверждена. Публикация остановлена.')
   const operationId=crypto.randomUUID();setPending(operationId)
   const status=await request('/api/publications',{operationId,target,operation:'publish',expectedRevision,sourceDigest})
   received(status)
  }catch(error){if(terminalFailure(error))setPending(null);toast.error(error instanceof Error?error.message:'Доставка недоступна.');changed()}
  finally{setBusy(false)}
 }
 if(!hasPublishPermission)return null
 return <FormSubmit buttonId="action-save" type="button" size="medium" disabled={busy||uploadStatus==='uploading'||(!modified&&!pending&&hasPublishedDoc&&unpublishedVersionCount===0)} onClick={()=>void publish()}>{pending&&!modified?'Повторить доставку':'Опубликовать'}</FormSubmit>
}
export function PublicationUnpublishButton() {
 const {id,hasPublishPermission,setHasPublishedDoc,setUnpublishedVersionCount}=useDocumentInfo(),{toggleModal}=useModal()
 const {state}=useDelivery(id?String(id):undefined),[busy,setBusy]=useState(false),[pending,setPending]=useState<string|null>(null)
 const modal='confirmed-unpublish-'+id
 const unpublish=async()=>{
  if(!state?.saved||busy)return
  setBusy(true)
  try{const existing=pending??state.operations.find(item=>item.operation==='unpublish'&&item.canRetry)?.operationId,operationId=existing??crypto.randomUUID();setPending(operationId);const status=await request('/api/publications',existing?{retryOperationId:existing}:{operationId,...state.saved,operation:'unpublish'});deliveryToast(status);if(status.status==='delivered'){setPending(null);setHasPublishedDoc(false);setUnpublishedVersionCount(1)}}catch(error){if(terminalFailure(error))setPending(null);toast.error(error instanceof Error?error.message:'Доставка недоступна.');changed()}
  finally{setBusy(false)}
 }
 if(!id||!hasPublishPermission||!state?.published)return null
 return <><PopupList.Button id="action-unpublish" onClick={()=>toggleModal(modal)}>Снять с публикации</PopupList.Button><ConfirmationModal modalSlug={modal} heading="Снять проект с публикации?" body="Страница и ссылки на проект исчезнут с сайта после подтверждённой доставки." confirmingLabel="Снятие с публикации" onConfirm={unpublish}/></>
}
export function DeliveryStatus() {
 const {id,hasPublishedDoc,unpublishedVersionCount,docPermissions,incrementVersionCount,setMostRecentVersionIsAutosaved}=useDocumentInfo(),{reset}=useForm(),{toggleModal}=useModal()
 const {state,error}=useDelivery(id?String(id):undefined),latest=id?state?.operations[0]:undefined,waiting=latest&&['pending','committing','activating'].includes(latest.status)
 const label=!id?'Черновик — на сайте не опубликован.':error?'Статус доставки недоступен.':!state?'Проверка доставки…':waiting?'Доставка на сайт не подтверждена.':state?.published?'Опубликовано на сайте.':'Черновик — на сайте не опубликован.'
 const modal='revert-saved-draft-'+id
 const revert=async()=>{
  try {
   const published=await (await fetch(`/api/projects/${id}?depth=0`)).json()
   if(!published?.id||published._status!=='published')throw new Error('Сохранённая опубликованная версия недоступна.')
   const response=await fetch(`/api/projects/${id}?draft=true&depth=0`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({...published,_status:'draft'})})
   const result=await response.json();if(!response.ok)throw new Error(result.message??'Не удалось вернуть черновик.')
   await reset(result.doc);incrementVersionCount();setMostRecentVersionIsAutosaved(false);toast.success('Сохранённая версия возвращена в черновик.');changed()
  }catch(error){toast.error(error instanceof Error?error.message:'Черновик недоступен.')}
 }
 return <div className="status"><p>{label}</p>{latest?.canRetry&&<Button buttonStyle="secondary" size="xsmall" onClick={()=>void request('/api/publications',{retryOperationId:latest.operationId}).then(deliveryToast).catch(error=>{toast.error(error.message);changed()})}>Повторить доставку сохранённой версии</Button>}{id&&docPermissions?.update&&hasPublishedDoc&&unpublishedVersionCount>0&&state?.published&&!waiting&&(!latest||latest.status==='delivered')&&<><Button buttonStyle="secondary" size="xsmall" onClick={()=>toggleModal(modal)}>Вернуть сохранённую версию в черновик</Button><ConfirmationModal modalSlug={modal} heading="Вернуть сохранённую версию?" body="Текущие изменения черновика будут заменены сохранённой опубликованной версией. Сайт сохранится." confirmingLabel="Восстановление черновика" onConfirm={revert}/></>}</div>
}
export function DeliveryCell({rowData}:{rowData?:{id?:string|number}}) {
 const {state,error}=useDelivery(rowData?.id?String(rowData.id):undefined)
 if(error)return <span>Статус недоступен</span>
 if(!state)return <span>Проверка доставки…</span>
 if(state.operations[0]&&['pending','committing','activating'].includes(state.operations[0].status))return <span>Доставка не подтверждена</span>
 return <span>{state.published?'На сайте':'Черновик'}</span>
}
export function PublicationOperations() {
 const {state,error}=useDelivery()
 const operations=state?.operations.filter(item=>item.operation==='delete'||['pending','committing','activating','failed','conflict','superseded'].includes(item.status)).slice(0,20)??[]
 if(error)return <p>Статус доставки недоступен.</p>
 if(!operations.length)return null
 return <details><summary>Операции доставки ({operations.length})</summary><ul>{operations.map(item=><li key={item.operationId}>Проект {item.target}: {item.status==='delivered'?'изменение применено':item.status==='conflict'||item.status==='superseded'?'ревизия изменилась; требуется новая публикация':'доставка не подтверждена'} {item.canRetry&&<Button buttonStyle="secondary" size="xsmall" onClick={()=>void request('/api/publications',{retryOperationId:item.operationId}).then(deliveryToast).catch(error=>{toast.error(error.message);changed()})}>Повторить доставку</Button>}</li>)}</ul></details>
}
