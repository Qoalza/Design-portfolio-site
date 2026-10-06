import {open,constants} from 'node:fs/promises'
import path from 'node:path'
import {runtimeSettings} from '../../../../../../scripts/runtime-settings.mjs'
import {schemaHash} from '../../../../../../scripts/schema.mjs'
import {producer} from '../../../../../../scripts/artifact.mjs'
export const dynamic='force-dynamic'
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'}
export async function GET(request:Request){
 try{
  const settings=runtimeSettings()
  const host=`127.0.0.1:${settings.port}`,forwardedHost=request.headers.get('x-forwarded-host'),forwardedProto=request.headers.get('x-forwarded-proto')
  // Next normalizes route URLs; the actual transport Host remains authoritative.
  if(request.headers.get('host')!==host||(forwardedHost!==null&&forwardedHost!==host)||(forwardedProto!==null&&forwardedProto!=='http'))return Response.json({error:'private-health-only'},{status:403,headers})
  const build=JSON.parse(process.env.PAYLOAD_CMS_BUILD_ID??'null') as {sourceSha?:unknown;artifactSha256?:unknown}|null
  if(!build||typeof build.sourceSha!=='string'||!/^[a-f0-9]{40}$/.test(build.sourceSha)||typeof build.artifactSha256!=='string'||!/^[a-f0-9]{64}$/.test(build.artifactSha256))throw new Error('Build identity unavailable')
  const epoch=process.env.PAYLOAD_CODE_ACTIVATION_SEQ??'0',codeActivationSeq=Number(epoch)
  if(!/^(0|[1-9][0-9]*)$/.test(epoch)||!Number.isSafeInteger(codeActivationSeq))throw new Error('Code activation unavailable')
  const fd=await open(path.join(settings.root+'-lock','owner.json'),constants.O_RDONLY|constants.O_NOFOLLOW)
  let owner:{pid?:number;childPID?:number;token?:string}
  try{const info=await fd.stat();if(!info.isFile()||info.size>4096)throw new Error('Invalid owner');owner=JSON.parse(await fd.readFile('utf8'))}finally{await fd.close()}
  if(owner.pid!==process.ppid||owner.childPID!==process.pid||!process.env.PAYLOAD_WRITER_TOKEN||owner.token!==process.env.PAYLOAD_WRITER_TOKEN)throw new Error('Writer identity unavailable')
  const actualSchema=await schemaHash(settings.root,{contractRoot:process.cwd()})
  if(actualSchema!==process.env.PAYLOAD_CMS_SCHEMA_HASH)throw new Error('Schema differs')
  return Response.json({cmsBuildId:build,codeActivationSeq,schemaHash:actualSchema,producer,writerConfirmed:true},{headers})
 }catch{return Response.json({error:'cms-not-ready'},{status:503,headers})}
}
