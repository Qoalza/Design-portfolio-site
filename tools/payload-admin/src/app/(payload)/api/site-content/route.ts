import {getPayload} from 'payload'
import config from '@payload-config'
import {readPublishedSiteContent} from '../../../../site/read-content'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(){
 try{
  const content=await readPublishedSiteContent(await getPayload({config}))
  return Response.json(content,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
 }catch{
  return Response.json({error:'Содержимое сайта временно недоступно.'},{status:503,headers:{'Cache-Control':'no-store'}})
 }
}
