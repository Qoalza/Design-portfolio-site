import {getPayload} from 'payload'
import config from '@payload-config'
import {readMaterialForm,MaterialRequestError} from '../../../../../materials/request'
import {ingestPackage} from '../../../../../materials/package-ingest'
export const runtime='nodejs'
export const dynamic='force-dynamic'
let active=false
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex'}
export async function POST(request:Request) {
 const payload=await getPayload({config})
 const {user}=await payload.auth({headers:request.headers})
 if(!user) return Response.json({error:'Необходимо войти в Payload.'},{status:401,headers})
 if(active) return Response.json({error:'Другая загрузка верстки ещё обрабатывается.'},{status:429,headers})
 active=true
 try {
  const form=await readMaterialForm(request,(await config).serverURL!,64*1024*1024+512*1024)
  if([...form.keys()].some(key=>!['projectId','entry','file','path'].includes(key))||form.getAll('projectId').length!==1||form.getAll('entry').length!==1) throw new MaterialRequestError('Проверьте проект и начальный HTML файл.',400)
  const id=String(form.get('projectId')),entry=String(form.get('entry')),files=form.getAll('file'),paths=form.getAll('path')
  if(!/^[1-9]\d*$/.test(id)||!files.length||files.length>512||files.length!==paths.length||files.some(file=>!(file instanceof File))||paths.some(value=>typeof value!=='string')) throw new MaterialRequestError('Выберите файлы верстки и сохранённый проект.',400)
  const inputs=await Promise.all(files.map(async(file,index)=>({path:paths[index] as string,bytes:Buffer.from(await (file as File).arrayBuffer())})))
  const material=await ingestPackage({payload,user,projectId:Number(id),entry,files:inputs})
  return Response.json({material},{headers})
 }catch(error) {
  if(error instanceof MaterialRequestError) return Response.json({error:error.message},{status:error.status,headers})
  // Validation messages describe only user-selected paths; no internal paths or secrets.
  return Response.json({error:'Не удалось подключить верстку. Проверьте начальный HTML, форматы и наличие всех ресурсов. Прежняя сцена сохранена.'},{status:400,headers})
 }finally{active=false}
}
