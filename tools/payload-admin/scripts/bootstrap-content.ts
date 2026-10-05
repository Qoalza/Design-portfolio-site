import {readFile,readdir} from 'node:fs/promises'
import path from 'node:path'
import type {Payload} from 'payload'
import sharp from 'sharp'
import type {User} from '../src/payload-types'
import {readDeployedSiteBaseline,readLegacyDeployedSiteBaseline} from './production-baseline.mjs'
import {regular} from './state.mjs'
import {requiredAssets} from '../../portfolio-release/project-snapshot.mjs'
import {prepareReleaseRecords,readReleaseProjects} from '../src/release-export'
import {isDeepStrictEqual} from 'node:util'

// Private one-time OPS operation, never an HTTP endpoint or routine Publish path.
// Initial owner/schema are prepared before this call, while the runtime is offline.
export async function bootstrapProductionContent({payload,user,dataRoot,siteRoot,expectedSha,expectedContentHash,legacyRepoRoot}:{
 payload:Payload;user:User;dataRoot:string;siteRoot:string;expectedSha:string;expectedContentHash?:string;legacyRepoRoot?:string
}){
 const ownerFile=path.join(`${dataRoot}-lock`,'owner.json')
 await regular(ownerFile)
 const owner=JSON.parse(await readFile(ownerFile,'utf8')) as {pid:number;childPID:number|null}
 if(owner.pid!==process.pid&&!(owner.pid===process.ppid&&owner.childPID===process.pid))throw new Error('Owned offline maintenance lock required')
 for(const collection of ['media','project-files'] as const){
  const config=payload.config.collections.find(item=>item.slug===collection)!
  if(config.upload.staticDir!==path.join(dataRoot,collection))throw new Error('Bootstrap data root differs from native storage')
 }
 const access={user,overrideAccess:false}
 if(!user?.id)throw new Error('Initial owner required')
 // Reject retries and any existing authoring store, including unpublished records.
 for(const collection of ['projects','media','project-files'] as const){
  const result=await payload.find({collection,...access,limit:1,depth:0})
  if(result.totalDocs!==0)throw new Error('Bootstrap requires empty content storage')
 }
 for(const directory of ['media','project-files'])if((await readdir(path.join(dataRoot,directory))).length)throw new Error('Bootstrap requires empty physical upload storage')
 if((await payload.findVersions({collection:'projects',...access,limit:1})).totalDocs!==0)throw new Error('Bootstrap requires empty project history')
 const baseline=expectedContentHash?await readDeployedSiteBaseline({root:siteRoot,expectedSha,expectedContentHash}):legacyRepoRoot?await readLegacyDeployedSiteBaseline({root:siteRoot,expectedSha,repoRoot:legacyRepoRoot}):(()=>{throw new Error('Explicit snapshot or verified legacy source required')})()
 const packageTypes=new Map<string,string>()
 for(const project of baseline.projects)if(project.redesign?.hero.kind==='layout')for(const scene of project.redesign.hero.scenes)if(scene.source.kind==='package')for(const file of scene.source.files)packageTypes.set(scene.source.assetBase+file.path,file.mime)
 const mime:Record<string,string>={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.avif':'image/avif','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.wasm':'application/wasm'}
 const formats:Record<string,string>={png:'image/png',jpeg:'image/jpeg',webp:'image/webp'}
 const extensions:Record<string,string>={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/avif':'.avif'}
 const files=new Map<string,{relationTo:'media'|'project-files';value:number}>()
 const bindings=[]
 for(const asset of baseline.assets){
  const extension=path.extname(asset.publicPath).toLowerCase()
  let type=packageTypes.get(asset.publicPath)??mime[extension]
  if(/\.(png|jpe?g|webp)$/i.test(extension))type=formats[(await sharp(asset.bytes).metadata()).format??'']
  if(!type)throw new Error('Unsupported initial asset MIME')
  const collection=['image/png','image/jpeg','image/webp'].includes(type)?'media':'project-files',key=collection+':'+asset.sha256
  let relation=files.get(key)
  if(!relation){
   const file=await payload.create({collection,...access,data:collection==='media'?{alt:path.basename(asset.publicPath)}:{label:path.basename(asset.publicPath)},file:{name:asset.sha256+(extensions[type]??extension),mimetype:type,size:asset.bytes.length,data:asset.bytes}})
   relation={relationTo:collection,value:file.id};files.set(key,relation)
  }
  bindings.push({publicPath:asset.publicPath,file:relation})
 }
 const projectIds=[]
 for(const project of baseline.projects){
  const needed=requiredAssets(project).paths
  const record=await payload.create({collection:'projects',...access,data:{title:project.title,slug:project.slug,releaseContent:project,releaseAssets:bindings.filter(binding=>needed.has(binding.publicPath)),releaseExternalDependencies:baseline.provenance.externalDependencies?.map(url=>({url}))??[],_status:'published'}})
  projectIds.push(record.id)
 }
 const records=await readReleaseProjects(payload,user,'published')
 const verified=await prepareReleaseRecords({payload,user,dataRoot,records})
 if(!isDeepStrictEqual(verified.projects,baseline.projects)||verified.assets.length!==baseline.assets.length||verified.assets.some(asset=>!baseline.assets.some(original=>original.publicPath===asset.publicPath&&original.sha256===asset.sha256&&original.bytes.equals(asset.bytes))))throw new Error('Initial native content parity check failed')
 return {releaseIdentity:baseline.releaseIdentity,projectIds,assets:verified.assets.length}
}
