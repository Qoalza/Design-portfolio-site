import {getPayload} from 'payload'
import path from 'node:path'
import config from '@payload-config'
import {beginPreparation} from '../../../../../publication/service'
import {readPublicationRequest,PublicationRequestError} from '../../../../../publication/request'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex'}
export async function POST(request:Request){
 const payload=await getPayload({config}),{user}=await payload.auth({headers:request.headers})
 if(!user)return Response.json({error:'Необходимо войти в Payload.'},{status:401,headers})
 try{
  const body=await readPublicationRequest(request,(await config).serverURL!)
  if(Object.keys(body).some(key=>key!=='requestId')||typeof body.requestId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(body.requestId))throw new PublicationRequestError('Неверный запрос подготовки.',400)
  const appRoot=process.cwd(),dataRoot=process.env.PAYLOAD_LOCAL_ROOT||path.join(appRoot,'.local')
  const operation=await beginPreparation({payload,user,dataRoot,repoRoot:path.resolve(appRoot,'../..'),requestId:body.requestId})
  return Response.json({operation},{status:202,headers})
 }catch(error){if(error instanceof PublicationRequestError)return Response.json({error:error.message},{status:error.status,headers});return Response.json({error:'Подготовка выпуска недоступна. Проверьте опубликованные данные, статус текущей операции и сохранённую версию кода.'},{status:409,headers})}
}
