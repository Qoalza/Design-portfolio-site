import type {Payload} from 'payload'
import type {User} from '../payload-types'
import type {PackageMaterial} from '../authoring/packages'
import {prepareLayoutPackage,type PackageInput} from './layout-package'
export async function ingestPackage({payload,user,projectId,entry,files}:{payload:Payload;user:User|null;projectId:number;entry:string;files:PackageInput[]}):Promise<PackageMaterial> {
 if(!user||!Number.isSafeInteger(projectId)||projectId<1) throw new Error('Сначала войдите и сохраните проект.')
 const access={user:{...user,collection:'users' as const},overrideAccess:false}
 const project=await payload.findByID({collection:'projects',id:projectId,...access,depth:0,draft:true})
 if(!project.releaseContent) throw new Error('Проект редизайна не найден.')
 const prepared=await prepareLayoutPackage(project.slug,entry,files)
 const bindings:PackageMaterial['bindings']=[]
 // Complete validation precedes the first write. Originals are never transformed.
 for(const file of prepared.files) {
  const name=`layout-${file.sha256}.${file.path.split('.').at(-1)}`
  const upload={name,mimetype:file.mime,size:file.bytes.length,data:file.bytes}
  if(['image/png','image/jpeg','image/webp'].includes(file.mime)) {
   const record=await payload.create({collection:'media',...access,data:{alt:file.path},file:upload})
   bindings.push({publicPath:prepared.source.assetBase+file.path,file:{relationTo:'media',value:record.id}})
  }else{
   const record=await payload.create({collection:'project-files',...access,data:{label:file.path},file:upload})
   bindings.push({publicPath:prepared.source.assetBase+file.path,file:{relationTo:'project-files',value:record.id}})
  }
 }
 return {source:prepared.source,bindings,externalDependencies:prepared.externalDependencies}
}
