import type { Payload } from 'payload'
import type { User } from '../payload-types'
import { prepareImage, type ImageContext } from './image-quality'
import type { Material } from '../authoring/materials'
import { MaterialRequestError } from './request'
import { createHash } from 'node:crypto'

export async function ingestImage({payload,user,projectId,bytes,alt,context,raster}:{payload:Payload;user:User|null;projectId:number;bytes:Buffer;alt:string;context:ImageContext;raster:boolean}):Promise<Material> {
 if(!user) throw new Error('Необходимо войти в Payload.')
 if(!Number.isSafeInteger(projectId)||projectId<1) throw new Error('Сначала сохраните проект.')
 const access={user:{...user,collection:'users' as const},overrideAccess:false}
 const project=await payload.findByID({collection:'projects',id:projectId,...access,draft:true,depth:0})
 if(!project.releaseContent || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) throw new Error('Проект редизайна не найден.')
 const hash=createHash('sha256').update(bytes).digest('hex')
 // Validate/decode and store the untouched original before trying a conversion.
 const inspected=await prepareImage(bytes,'unknown')
 const original=await payload.create({collection:'media',...access,data:{alt:alt||'Исходник изображения проекта'},file:{name:`original-${hash}.${inspected.extension}`,mimetype:inspected.mime,size:bytes.length,data:bytes}})
 const selected=await prepareImage(bytes,context)
 if(raster && (Math.abs(selected.report.prepared.width/selected.report.prepared.height/(4096/2958)-1)>.001 || selected.report.prepared.width<1880 || selected.report.prepared.height<1880*2958/4096)) throw new MaterialRequestError('Для Фикс адаптива нужен экран в пропорции4096×2958, шириной от1880px. Исходник сохранён в Изображениях.',400)
 const prepared=selected.report.mode==='original'?original:await payload.create({collection:'media',...access,data:{alt:alt||'Изображение проекта'},file:{name:`prepared-${selected.report.prepared.sha256}.${selected.extension}`,mimetype:selected.mime,size:selected.bytes.length,data:selected.bytes}})
 const publicPath=`/assets/projects/${project.slug}/uploads/${selected.report.prepared.sha256}.${selected.extension}`
 return {publicPath,original:{relationTo:'media',value:original.id},prepared:{relationTo:'media',value:prepared.id},image:{src:publicPath,alt,width:selected.report.prepared.width,height:selected.report.prepared.height},report:selected.report}
}
