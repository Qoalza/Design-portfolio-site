import {randomBytes,createHash} from 'node:crypto'
import {readFile,lstat} from 'node:fs/promises'
import path from 'node:path'
import type {preparePreviewRelease} from './preview'
import {layoutPackageCsp} from '../../portfolio-release/layout-package-policy.mjs'
type Prepared=NonNullable<Awaited<ReturnType<typeof preparePreviewRelease>>>
type File={content:Buffer;mime?:string;packaged:boolean;scoped?:boolean}
type Artifact={prepared:Prepared;expires:number;owner:number;files:Map<string,File>;routes:Set<string>;base:string}
type Shell={files:Map<string,File>}
type PreviewState={artifacts:Map<string,Artifact>;shell?:{root:string;promise:Promise<Shell>}}
const processState=globalThis as typeof globalThis & {__payloadPrivatePreviewState?:PreviewState}
const state:PreviewState=processState.__payloadPrivatePreviewState??={artifacts:new Map<string,Artifact>()}
const placeholder='/api/preview-artifacts/'+'0'.repeat(64)+'/'
const ttl=30*60*1000
const mime:Record<string,string>={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',json:'application/json',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',svg:'image/svg+xml',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',wasm:'application/wasm'}
function scopeValue(value:unknown,base:string):unknown{
 if(typeof value==='string')return /^\/(assets|figma|fonts|cursors|projects)(\/|$)/.test(value)?base+value.slice(1):value
 if(Array.isArray(value))return value.map(item=>scopeValue(item,base))
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,scopeValue(item,base)]))
 return value
}
async function safeRead(root:string,name:string){
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(name)||name.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('Unsafe preview shell path')
 let current=root
 for(const part of name.split('/')){current=path.join(current,part);if((await lstat(current)).isSymbolicLink())throw new Error('Preview shell symlink')}
 return readFile(current)
}
async function loadShell(root:string):Promise<Shell>{
 if((await lstat(root)).isSymbolicLink())throw new Error('Preview shell symlink')
 const manifest=JSON.parse((await safeRead(root,'preview-manifest.json')).toString('utf8')) as {version:number;base:string;files:Array<{path:string;size:number;sha256:string}>;contentAssets:string[]}
 if(manifest.version!==1||manifest.base!==placeholder||!Array.isArray(manifest.contentAssets)||!Array.isArray(manifest.files)||manifest.files.length>4096||manifest.files.reduce((sum,file)=>sum+file.size,0)>128*1024*1024)throw new Error('Invalid prebuilt preview shell')
 const files=new Map<string,File>(),contentAssets=new Set(manifest.contentAssets.map(name=>name.replace(/^\//,'')))
 for(const entry of manifest.files){
  if(contentAssets.has(entry.path))continue
  if(files.has(entry.path))throw new Error('Duplicate preview shell file')
  const content=await safeRead(root,entry.path)
  if(content.length!==entry.size||createHash('sha256').update(content).digest('hex')!==entry.sha256)throw new Error('Preview shell checksum mismatch')
  files.set(entry.path,{content,packaged:false,scoped:/\.(html|css|js|mjs)$/.test(entry.path)})
 }
 if(!files.has('index.html'))throw new Error('Preview shell entry missing')
 return {files}
}
export function lastPreviewArtifact(owner:number,projectId:number,mode:'draft'|'published'){
 const item=[...state.artifacts].reverse().find(([,artifact])=>artifact.owner===owner&&artifact.prepared.source.projectId===projectId&&artifact.prepared.source.mode===mode&&artifact.expires>Date.now())
 return item?{base:item[1].base,expires:item[1].expires,slug:item[1].prepared.source.slug}:null
}
export async function createPreviewArtifact({prepared,owner}:{prepared:Prepared;dataRoot:string;owner:number}){
 // Native auth and validation precede creation. Only an expiring read capability
 // enters the sandboxed frame; compilation belongs exclusively to code release.
 for(const [key,item] of state.artifacts)if(item.expires<Date.now())state.artifacts.delete(key)
 for(const item of state.artifacts.values())if(item.owner===owner&&item.prepared.revision===prepared.revision)return {base:item.base,expires:item.expires,slug:item.prepared.source.slug}
 if(!Number.isSafeInteger(owner)||owner<=0)throw new Error('Preview owner required')
 const root=path.resolve(/*turbopackIgnore: true*/ process.env.PORTFOLIO_PREVIEW_ROOT||path.resolve(process.cwd(),'../../.portfolio-release/preview'))
 if(state.shell?.root!==root)state.shell={root,promise:loadShell(root)}
 const shell=await state.shell.promise
 for(const item of state.artifacts.values())if(item.owner===owner&&item.prepared.revision===prepared.revision)return {base:item.base,expires:item.expires,slug:item.prepared.source.slug}
 const size=prepared.assets.reduce((sum,asset)=>sum+asset.bytes.length,0)
 const cachedSize=[...state.artifacts.values()].reduce((sum,item)=>sum+item.prepared.assets.reduce((total,asset)=>total+asset.bytes.length,0),0)
 if(state.artifacts.size>=8||size>128*1024*1024||cachedSize+size>384*1024*1024)throw new Error('Preview cache capacity exceeded')
 const key=randomBytes(32).toString('hex'),base=`/api/preview-artifacts/${key}/`,files=new Map(shell.files)
 const packageTypes=new Map<string,string>()
 for(const project of prepared.projects)if(project.redesign?.hero.kind==='layout')for(const scene of project.redesign.hero.scenes)if(scene.source.kind==='package')for(const file of scene.source.files)packageTypes.set(scene.source.assetBase+file.path,file.mime)
 for(const asset of prepared.assets)files.set(asset.publicPath.slice(1),{content:asset.bytes,mime:packageTypes.get(asset.publicPath),packaged:packageTypes.has(asset.publicPath)})
 const json=JSON.stringify({version:1,revision:prepared.revision,projects:scopeValue(prepared.projects,base)}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')
 const html=files.get('index.html')!.content.toString('utf8').replaceAll(placeholder,base).replace('</head>',`<script id="portfolio-projects" type="application/json">${json}</script></head>`)
 files.set('index.html',{content:Buffer.from(html),packaged:false})
 const expires=Date.now()+ttl
 state.artifacts.set(key,{prepared,expires,owner,files,routes:new Set(['',...prepared.projects.map(project=>`projects/${project.slug}`)]),base})
 return {base,expires,slug:prepared.source.slug}
}
export async function previewArtifactResponse(key:string,segments:string[],head=false){
 const denied=()=>new Response(null,{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}})
 if(!/^[a-f0-9]{64}$/.test(key)||segments.some(segment=>!segment||segment==='.'||segment==='..'||/[\\/%\u0000-\u001f]/.test(segment)))return denied()
 const item=state.artifacts.get(key)
 if(!item||item.expires<Date.now())return denied()
 const route=segments.join('/'),name=item.routes.has(route)?'index.html':route
 const file=item.files.get(name)
 if(!file)return denied()
 const bytes=file.scoped?Buffer.from(file.content.toString('utf8').replaceAll(placeholder,item.base)):file.content
 const type=file.mime??mime[name.split('.').at(-1)!]??'application/octet-stream'
 const headers:Record<string,string>={'Content-Type':type,'Content-Length':String(bytes.length),'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'*'}
 if(type.startsWith('text/html')||type==='image/svg+xml')headers['Content-Security-Policy']=file.packaged?layoutPackageCsp:"sandbox allow-scripts; default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data:; frame-src 'self' https:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
 return new Response(head?null:new Uint8Array(bytes),{headers})
}
