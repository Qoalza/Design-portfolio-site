import {getPayload} from 'payload'
import path from 'node:path'
import config from '@payload-config'
import {OperationStore} from '../../../../../publication/operations'
import {readPublicationRequest,PublicationRequestError} from '../../../../../publication/request'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex'}
export async function POST(request:Request){
 const payload=await getPayload({config}),{user}=await payload.auth({headers:request.headers})
 if(!user)return Response.json({error:'Необходимо войти в Payload.'},{status:401,headers})
 try{
  const body=await readPublicationRequest(request,(await config).serverURL!)
  if(Object.keys(body).some(key=>key!=='id')||typeof body.id!=='string')throw new PublicationRequestError('Неверная операция.',400)
  const store=new OperationStore(process.env.PAYLOAD_LOCAL_ROOT||path.join(process.cwd(),'.local')),operation=await store.read(body.id,user.id)
  if(operation.state!=='ready')throw new PublicationRequestError('Снять подготовку можно только до отправки на сайт.',409)
  return Response.json({operation:await store.transition(body.id,user.id,'ready','failed',{errorCode:'CANCELED'})},{headers})
 }catch(error){if(error instanceof PublicationRequestError)return Response.json({error:error.message},{status:error.status,headers});return Response.json({error:'Операция недоступна.'},{status:404,headers})}
}
