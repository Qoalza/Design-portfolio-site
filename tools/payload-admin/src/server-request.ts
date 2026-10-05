import {runtimeSettings} from '../scripts/runtime-settings.mjs'
// Browser writes stay on the approved online origin. Never expose first-user
// registration while the initial account is being provisioned by the operator.
export function serverWriteDenial(request:Request,slug:readonly string[]|undefined):Response|null{
 const settings=runtimeSettings()
 if(!settings.server)return null
 const denied=()=>Response.json({error:'Запрос недоступен.'},{status:403,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}})
 if(slug?.[0]==='users'&&slug[1]==='first-register')return denied()
 if(request.headers.get('origin')!==settings.origin||request.headers.get('host')!==new URL(settings.origin).host)return denied()
 return null
}
