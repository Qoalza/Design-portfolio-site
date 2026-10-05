import type { RedesignLayoutSource } from '../../../../src/lib/project-redesign-contract'
import {editorState} from './hero'
import {replaceValue,valueAt,type Value,type ValuePath} from './model'
export type PackageMaterial={source:Extract<RedesignLayoutSource,{kind:'package'}>;bindings:{publicPath:string;file:{relationTo:'media'|'project-files';value:number}}[];externalDependencies:string[]}
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==='object'&&!Array.isArray(value))
export function packageRecords(document:unknown):PackageMaterial[] {
 const items=editorState(document)?.packages
 if(items===undefined) return []
 if(!Array.isArray(items)||items.length>200) throw new Error('Слишком много пакетов верстки.')
 return items.map(item=>{
  if(!object(item)||!object(item.source)||item.source.kind!=='package'||typeof item.source.assetBase!=='string'||!/^\/assets\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\/hero-layout\/[a-f0-9]{64}\/$/.test(item.source.assetBase)||typeof item.source.entry!=='string'||!Array.isArray(item.source.files)||!Array.isArray(item.bindings)||!Array.isArray(item.externalDependencies)) throw new Error('Пакет верстки повреждён.')
  const files:unknown[]=item.source.files
  const entry=item.source.entry
  if(!files.length||files.length>512||item.bindings.length!==files.length||new Set(files.map(file=>object(file)?file.path:undefined)).size!==files.length) throw new Error('Список файлов верстки повреждён.')
  for(const [index,file] of files.entries()) {
   const binding=item.bindings[index]
   if(!object(file)||typeof file.path!=='string'||!file.path||/[:\\%?#\u0000-\u0020\u007f]/.test(file.path)||file.path.split('/').some(part=>!part||part==='.'||part==='..')||typeof file.sha256!=='string'||!/^[a-f0-9]{64}$/.test(file.sha256)||!Number.isSafeInteger(file.size)||Number(file.size)<1||Number(file.size)>20*1024*1024||typeof file.mime!=='string'||!object(binding)||binding.publicPath!==item.source.assetBase+file.path||!object(binding.file)||!['media','project-files'].includes(String(binding.file.relationTo))||!Number.isSafeInteger(binding.file.value)||Number(binding.file.value)<1) throw new Error('Связь файла верстки повреждена.')
  }
  if(files.reduce<number>((sum,file)=>sum+Number((file as Record<string,unknown>).size),0)>64*1024*1024||!files.some(file=>object(file)&&file.path===entry&&file.mime==='text/html')) throw new Error('Начальный файл или размер верстки повреждён.')
  if(item.externalDependencies.some(url=>typeof url!=='string'||!/^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)\//.test(url))) throw new Error('Внешний ресурс верстки не поддерживается.')
  return item as unknown as PackageMaterial
 })
}
export function sceneSourceSlot(path:ValuePath) {
 return path.length===5&&path[0]==='redesign'&&path[1]==='hero'&&path[2]==='scenes'&&typeof path[3]==='number'&&path[4]==='source'
}
export function bindPackage(document:Value,path:ValuePath,material:PackageMaterial):Value {
 if(!sceneSourceSlot(path)||!object(valueAt(document,path))) throw new Error('Выберите сцену верстки.')
 const records=packageRecords(document),state=editorState(document)
 const packages=[...records.filter(item=>item.source.assetBase!==material.source.assetBase),material]
 if(packages.length>200) throw new Error('Слишком много пакетов верстки.')
 return {...replaceValue(document,path,material.source) as Record<string,Value>,_payloadEditor:{version:1,heroes:{},...state,packages:packages as unknown as Value}}
}
export function bindSceneUrl(document:Value,path:ValuePath,url:string):Value {
 if(!sceneSourceSlot(path)||!object(valueAt(document,path))) throw new Error('Выберите сцену верстки.')
 return replaceValue(document,path,{kind:'url',url})
}
export function usesPackageFile(document:unknown,collection:string,id:string) {
 if(!object(document)||!object(document._payloadEditor)||!Array.isArray(document._payloadEditor.packages)) return false
 return document._payloadEditor.packages.some(item=>object(item)&&Array.isArray(item.bindings)&&item.bindings.some(binding=>object(binding)&&object(binding.file)&&binding.file.relationTo===collection&&String(binding.file.value)===id))
}
export function layoutSelection(files:readonly {name:string;webkitRelativePath:string}[]) {
 const folder=files[0]?.webkitRelativePath.split('/')[0]
 const folderSelection=Boolean(folder&&files.every(file=>file.webkitRelativePath.startsWith(`${folder}/`)))
 const paths=files.map(file=>folderSelection?file.webkitRelativePath.slice((folder?.length??0)+1):file.name)
 return {paths,entry:paths.find(name=>/^index\.html?$/i.test(name))||paths.find(name=>/\.html?$/i.test(name))||''}
}
