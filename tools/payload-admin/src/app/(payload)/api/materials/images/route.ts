import { getPayload } from 'payload'
import config from '@payload-config'
import { ingestImage } from '../../../../../materials/image-ingest'
import { MaterialRequestError, readMaterialForm } from '../../../../../materials/request'
import type { ImageContext } from '../../../../../materials/image-quality'

export const runtime='nodejs'
export const dynamic='force-dynamic'
let active=false
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex'}
export async function POST(request:Request) {
 const payload=await getPayload({config})
 const {user}=await payload.auth({headers:request.headers})
 if(!user) return Response.json({error:'Необходимо войти в Payload.'},{status:401,headers})
 if(active) return Response.json({error:'Другая загрузка ещё обрабатывается. Повторите после её завершения.'},{status:429,headers})
 active=true
 try {
  const form=await readMaterialForm(request,(await config).serverURL!)
  const file=form.get('file'), id=String(form.get('projectId')??''), context=String(form.get('context')??'unknown'), slot=String(form.get('slot')??'image')
  if([...form.keys()].some(key=>!['file','projectId','context','slot'].includes(key)) || form.getAll('file').length!==1 || !(file instanceof File) || !/^[1-9]\d*$/.test(id) || !['screen','diagram','photo','illustration','unknown'].includes(context) || !['image','raster'].includes(slot) || file.size>20*1024*1024 || !file.size) throw new MaterialRequestError('Проверьте файл и назначение загрузки.',400)
  const material=await ingestImage({payload,user,projectId:Number(id),bytes:Buffer.from(await file.arrayBuffer()),alt:file.name.slice(0,200),context:context as ImageContext,raster:slot==='raster'})
  return Response.json({material},{headers})
 } catch(error) {
  if(error instanceof MaterialRequestError) return Response.json({error:error.message},{status:error.status,headers})
  return Response.json({error:'Не удалось подготовить изображение. Исходник, если загрузка завершилась, доступен в Изображениях; прежние данные проекта сохранены.'},{status:400,headers})
 } finally {active=false}
}
