import {getPayload} from 'payload'
import path from 'node:path'
import config from '@payload-config'
import {OperationStore} from '../../../../../publication/operations'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex'}
export async function GET(request:Request){
 const payload=await getPayload({config}),{user}=await payload.auth({headers:request.headers})
 if(!user)return Response.json({error:'Необходимо войти в Payload.'},{status:401,headers})
 try{
  const store=new OperationStore(process.env.PAYLOAD_LOCAL_ROOT||path.join(process.cwd(),'.local')),id=new URL(request.url).searchParams.get('id')
  return Response.json({operation:id?await store.read(id,user.id):await store.active(user.id)},{headers})
 }catch{return Response.json({error:'Операция недоступна.'},{status:404,headers})}
}
