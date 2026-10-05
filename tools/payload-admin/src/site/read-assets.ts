import {createHash} from 'node:crypto'
import type {Payload} from 'payload'
import {prepareRecordAssets} from '../release-export'
import {readPublishedSiteRecords} from './read-content'

// Only the committed published bindings select upload IDs. Visitors never supply IDs.
const caches=new WeakMap<Payload,{revision:string;assets:Promise<Map<string,{content:Buffer;sha256:string;mime?:string;packaged:boolean}>>}>()
export async function readPublishedSiteAsset(payload:Payload,dataRoot:string,pathname:string){
 const records=await readPublishedSiteRecords(payload)
 const revision=createHash('sha256').update(JSON.stringify(records.map(record=>[record.id,record.title,record.slug,record.releaseContent,record.releaseAssets]))).digest('hex')
 let cache=caches.get(payload)
 if(cache?.revision!==revision){
  const assets=prepareRecordAssets({records,dataRoot,resolveFile:(collection,id)=>payload.findByID({collection,id,overrideAccess:true,depth:0})}).then(prepared=>{
   const packageTypes=new Map<string,string>()
   for(const project of prepared.projects)if(project.redesign?.hero.kind==='layout')for(const scene of project.redesign.hero.scenes)if(scene.source.kind==='package')for(const file of scene.source.files)packageTypes.set(scene.source.assetBase+file.path,file.mime)
   return new Map(prepared.assets.map(asset=>[asset.publicPath,{content:asset.bytes,sha256:asset.sha256,mime:packageTypes.get(asset.publicPath),packaged:packageTypes.has(asset.publicPath)}]))
  })
  cache={revision,assets};caches.set(payload,cache)
  void assets.catch(()=>{if(caches.get(payload)===cache)caches.delete(payload)})
 }
 return (await cache.assets).get(pathname)??null
}
