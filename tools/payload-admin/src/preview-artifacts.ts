import {randomBytes,createHash} from 'node:crypto'
import {mkdtemp,mkdir,writeFile,readFile,rm,lstat} from 'node:fs/promises'
import path from 'node:path'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import type {preparePreviewRelease} from './preview'
import {layoutPackageCsp} from '../../portfolio-release/layout-package-policy.mjs'
const exec=promisify(execFile)
type Prepared=NonNullable<Awaited<ReturnType<typeof preparePreviewRelease>>>
type Manifest={version:1;revision:string;base:string;files:Array<{path:string;size:number;sha256:string}>;packageFiles:Record<string,string>;source:{projectId:number;mode:'draft'|'published'}}
type Artifact={directory:string;manifest:Manifest;expires:number;routes:Set<string>;revision:string;owner:number}
type PreviewState={artifacts:Map<string,Artifact>;compiling:boolean}
const processState=globalThis as typeof globalThis & {__payloadPrivatePreviewState?:PreviewState}
const state:PreviewState=processState.__payloadPrivatePreviewState??={artifacts:new Map<string,Artifact>(),compiling:false}
const artifacts=state.artifacts
export function lastPreviewArtifact(owner:number,projectId:number,mode:'draft'|'published') {
 const items=[...artifacts].reverse()
 const item=items.find(([,artifact])=>artifact.owner===owner&&artifact.manifest.source.projectId===projectId&&artifact.manifest.source.mode===mode&&artifact.expires>Date.now())
 return item?{base:`/api/preview-artifacts/${item[0]}/`,expires:item[1].expires}:null
}
const ttl=30*60*1000
const mime:Record<string,string>={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',json:'application/json',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',svg:'image/svg+xml',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',wasm:'application/wasm'}
export async function createPreviewArtifact({prepared,dataRoot,owner}:{prepared:Prepared;dataRoot:string;owner:number}) {
 // Creation is called only after native auth and full producer validation. The frame
 // receives a read-only expiring capability, never CMS cookies, JWTs or API credentials.
 for(const [key,item] of artifacts)if(item.expires<Date.now()){artifacts.delete(key);await rm(item.directory,{recursive:true,force:true})}
 for(const [key,item] of artifacts)if(item.owner===owner&&item.revision===prepared.revision){return {base:`/api/preview-artifacts/${key}/`,expires:item.expires}}
 if(state.compiling)throw new Error('Preview compilation already in progress')
 if(artifacts.size>=8||[...artifacts.values()].reduce((sum,item)=>sum+item.manifest.files.reduce((size,file)=>size+file.size,0),0)>384*1024*1024)throw new Error('Preview cache capacity exceeded')
 if(prepared.assets.reduce((sum,asset)=>sum+asset.bytes.length,0)>128*1024*1024)throw new Error('Preview asset budget exceeded')
 state.compiling=true
 let directory:string|undefined
 try {
  const cache=path.join(dataRoot,'previews');await mkdir(cache,{recursive:true,mode:0o700})
  if((await lstat(cache)).isSymbolicLink())throw new Error('Preview cache symlink')
  directory=await mkdtemp(path.join(cache,'artifact-'))
  const key=randomBytes(32).toString('hex'),base=`/api/preview-artifacts/${key}/`
  const input=path.join(directory,'input.json'),output=path.join(directory,'site')
  await writeFile(input,JSON.stringify({...prepared,assets:prepared.assets.map(asset=>({publicPath:asset.publicPath,sha256:asset.sha256,base64:asset.bytes.toString('base64')}))}),{mode:0o600})
  const appRoot=path.resolve(/*turbopackIgnore: true*/ process.cwd())
  const compileEnv:NodeJS.ProcessEnv={...process.env,PORTFOLIO_PROJECT_SNAPSHOT:''};delete compileEnv.PAYLOAD_SECRET
  await exec(process.execPath,['--import','tsx',path.join(appRoot,'scripts/preview/compile.mjs'),input,output,base],{cwd:appRoot,timeout:120000,maxBuffer:1024*1024,env:compileEnv})
  await rm(input)
  const manifest=JSON.parse(await readFile(path.join(output,'preview-manifest.json'),'utf8')) as Manifest
  if(manifest.version!==1||manifest.revision!==prepared.revision||manifest.base!==base||manifest.files.length>4096||manifest.files.reduce((sum,file)=>sum+file.size,0)>128*1024*1024)throw new Error('Preview manifest mismatch')
  const expires=Date.now()+ttl
  artifacts.set(key,{directory,manifest,expires,revision:prepared.revision,owner,routes:new Set(['',...prepared.projects.map(project=>`projects/${project.slug}`)])})
  return {base,expires}
 }catch{if(directory)await rm(directory,{recursive:true,force:true});throw new Error('Не удалось собрать предпросмотр. Проверьте сохранённые данные и ресурсы.')}
 finally{state.compiling=false}
}
export async function previewArtifactResponse(key:string,segments:string[],head=false) {
 const denied=()=>new Response(head?null:'Not found',{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}})
 if(!/^[a-f0-9]{64}$/.test(key)||segments.some(segment=>!segment||segment==='.'||segment==='..'||/[\\/%\u0000-\u001f]/.test(segment)))return denied()
 const item=artifacts.get(key)
 if(!item||item.expires<Date.now())return denied()
 const route=segments.join('/'),name=item.routes.has(route)?'index.html':route
 const entry=item.manifest.files.find(file=>file.path===name)
 if(!entry)return denied()
 try {
  const file=path.join(item.directory,'site',name)
  if((await lstat(file)).isSymbolicLink())return denied()
  const bytes=await readFile(file)
  if(bytes.length!==entry.size||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)return denied()
  const type=item.manifest.packageFiles[name]??mime[name.split('.').at(-1)!]??'application/octet-stream'
  const headers:Record<string,string>={'Content-Type':type,'Content-Length':String(bytes.length),'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'*'}
  if(type.startsWith('text/html'))headers['Content-Security-Policy']=item.manifest.packageFiles[name]?layoutPackageCsp:"sandbox allow-scripts; default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data:; frame-src 'self' https:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
  return new Response(head?null:new Uint8Array(bytes),{headers})
 }catch{return denied()}
}
