import assert from 'node:assert/strict'
import path from 'node:path'
import sharp from 'sharp'
import {createHash} from 'node:crypto'
import {getPayload,createLocalReq,restoreVersionOperation} from 'payload'
import config from '../src/payload.config'
import {guardProjectPublication,guardProjectDelete} from '../src/publication/guard'
import {createNativePublicationAdapter,authorDigest} from '../src/publication/native'
import {createPublicationCoordinator,type PublicationIntent} from '../../portfolio-delivery/coordinator.mjs'
import {DELIVERY_CAPABILITIES} from '../../portfolio-delivery/contract.mjs'
import {fixture} from '../../../tests/fixtures/portfolio-delivery.mjs'
import type {Project} from '../src/payload-types'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT!)
assert.match(path.basename(root),/^des-art-payload-test-/)
const configuration=await config,collection=configuration.collections.find(item=>item.slug==='projects')!
collection.hooks.beforeOperation.push(guardProjectPublication)
collection.hooks.beforeDelete.push(guardProjectDelete)
const payload=await getPayload({config:configuration})
try {
 const user=await payload.create({collection:'users',data:{email:'publication@example.test',password:'Disposable-fixture-long-passphrase'}})
 const source=fixture()
 // Native fixture generates decodable bitmaps matching the approved raster
 // proportion and minimum pixels; no production/Git source images are read.
 const png=await sharp({create:{width:2048,height:1479,channels:3,background:'#112233'}}).png().toBuffer()
 const prepared640=await sharp(png).resize({width:640}).avif().toBuffer(),prepared1080=await sharp(png).resize({width:1080}).avif().toBuffer()
 for(const asset of source.assets){asset.bytes=asset.mime==='image/png'?png:asset.publicPath.includes('-640.')?prepared640:prepared1080;asset.sha256=createHash('sha256').update(asset.bytes).digest('hex')}
 function imageDimensions(value:unknown) {
  if(!value||typeof value!=='object')return
  const item=value as Record<string,unknown>
  if(typeof item.src==='string'&&typeof item.width==='number'){item.width=2048;item.height=1479}
  for(const child of Object.values(item))imageDimensions(child)
 }
 for(const project of source.projects)imageDimensions(project.redesign)
 const files=new Map<string,{relationTo:'media'|'project-files';value:number}>()
 for(const asset of source.assets)if(!files.has(asset.sha256)) {
  const isImage=asset.mime==='image/png',collection=isImage?'media':'project-files'
  const record=await payload.create({collection,user,overrideAccess:false,data:isImage?{alt:'Synthetic publication fixture'}:{label:'Synthetic prepared AVIF'},file:{name:isImage?'fixture.png':'fixture.avif',mimetype:asset.mime,data:asset.bytes,size:asset.bytes.length}})
  files.set(asset.sha256,{relationTo:collection,value:record.id})
 }
 const projects:Project[]=[]
 for(const project of source.projects)projects.push(await payload.create({collection:'projects',user,overrideAccess:false,draft:true,data:{title:project.title,slug:project.slug,releaseContent:project as unknown as Record<string,unknown>,releaseAssets:source.assets.filter(asset=>asset.publicPath.startsWith(`/assets/projects/${project.slug}/`)).map(asset=>({publicPath:asset.publicPath,file:files.get(asset.sha256)!})),_status:'draft'}}))
 const native=createNativePublicationAdapter({payload,user,dataRoot:root})
 const renderer={rendererId:'a'.repeat(64),contractVersion:'public-delivery-v1' as const,capabilities:DELIVERY_CAPABILITIES}
 const publicRoot=path.join(root,'public-delivery'),privateRoot=path.join(root,'private-delivery')
 const {createGenerationReader}=await import('../../portfolio-delivery/reader.mjs')
 const reader=createGenerationReader({root:publicRoot,renderer})
 let fail=false
 const coordinator=createPublicationCoordinator({publicRoot,privateRoot,renderer,native,probe:async request=>{
  if(fail&&request.kind==='candidate')throw new Error('Injected readiness failure')
  if(request.kind==='candidate')await reader.readGeneration(request.contentId);else assert.deepEqual((await reader.readActive({allowLastGood:false})).descriptor,request.descriptor)
 }})
 await coordinator.initialize({prepared:{projects:[],assets:[],externalDependencies:[]},mapping:[]})
 let counter=0
 async function intent(target:number,operation:PublicationIntent['operation']='publish',selectedVersionId?:string) {
  const current=(await native.inspect(String(target)))!
  const chosen=selectedVersionId?await native.selectVersion(selectedVersionId,String(target)):current.record
  return {operationId:'native_fixture_'+String(++counter).padStart(16,'0'),actor:String(user.id),target:String(target),operation,expectedRevision:current.state.revision,sourceDigest:authorDigest(chosen),...(selectedVersionId?{selectedVersionId}:{})}
 }
 // Direct Local API, bulk and forged JSON context cannot bypass publication.
 await assert.rejects(()=>payload.update({collection:'projects',id:projects[0].id,user,overrideAccess:false,data:{_status:'published'},context:{publication:true,trusted:true}}),/подтверждённую/)
 await assert.rejects(()=>payload.update({collection:'projects',where:{id:{in:projects.map(item=>item.id)}},user,overrideAccess:false,data:{_status:'published'}}),/подтверждённую/)
 await assert.rejects(()=>payload.update({collection:'projects',id:projects[0].id,user,overrideAccess:false,draft:true,data:{_status:'published'},context:{publication:true}}),/подтверждённую/)
 await assert.rejects(()=>payload.create({collection:'projects',user,overrideAccess:false,draft:true,data:{title:'Bypass',slug:'bypass',_status:'published'}}),/подтверждённую/)
 await assert.rejects(()=>payload.delete({collection:'projects',id:projects[0].id,user,overrideAccess:false}),/подтверждённую/)
 const first=await intent(projects[0].id)
 await native.prepare(first)
 const delivered=await coordinator.execute(first);assert.equal(delivered.status,'delivered',JSON.stringify(delivered))
 assert.equal((await coordinator.active()).generation.projects.length,1)
 const published=(await native.inspect(String(projects[0].id)))!,versionId=published.versionId
 assert.equal(published.record._status,'published')
 // Save a changed title with raw saved releaseContent title unchanged. Native
 // normalization must not become an artificial selected-source conflict.
 await payload.update({collection:'projects',id:projects[0].id,user,overrideAccess:false,draft:true,data:{title:'Updated title',_status:'draft'}})
 const chosen=await intent(projects[0].id);fail=true
 const pending=await coordinator.execute(chosen);assert.equal(pending.status,'pending',JSON.stringify(pending))
 const count=(await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs
 // Publish different target. Its delivery does not include failed target delta.
 fail=false;assert.equal((await coordinator.execute(await intent(projects[1].id))).status,'delivered')
 assert.equal((await coordinator.active()).generation.projects.find(project=>project.slug===projects[0].slug)!.title,projects[0].title)
 assert.equal((await coordinator.execute(chosen)).status,'delivered')
 assert.equal((await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs,count)
 assert.equal((await coordinator.active()).generation.projects.find(project=>project.slug===projects[0].slug)!.title,'Updated title')
 // Failure persisting the native checkpoint rolls back the short transaction.
 const beforeCheckpoint=(await native.inspect(String(projects[0].id)))!,beforeCount=(await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs
 const checkpointIntent=await intent(projects[0].id),normalBeforeCheckpoint=native.commit
 native.commit=async(input,source)=>normalBeforeCheckpoint(input,source,async()=>{throw new Error('Checkpoint disk failure')})
 assert.equal((await coordinator.execute(checkpointIntent)).status,'committing')
 assert.deepEqual((await native.inspect(String(projects[0].id)))!.state,beforeCheckpoint.state)
 assert.equal((await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs,beforeCount)
 native.commit=normalBeforeCheckpoint
 assert.equal((await coordinator.execute(checkpointIntent)).status,'delivered')
 // Native commit response loss: durable precommit result is reconciled against
 // actual DB version rather than performing another native save.
 const normalCommit=native.commit
 native.commit=async(...args)=>{await normalCommit(...args);throw new Error('Native commit response lost')}
 const lostIntent=await intent(projects[0].id),lost=await coordinator.execute(lostIntent)
 assert.equal(lost.status,'committing')
 const countAfterLoss=(await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs
 native.commit=normalCommit
 assert.equal((await coordinator.execute(lostIntent)).status,'delivered')
 assert.equal((await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs,countAfterLoss)
 // Historical version restore is exact and current revision concurrency checked.
 const restore=await intent(projects[0].id,'restore',versionId)
 assert.equal((await coordinator.execute(restore)).status,'delivered')
 assert.equal((await coordinator.active()).generation.projects.find(project=>project.slug===projects[0].slug)!.title,projects[0].title)
 const afterRestore=(await native.inspect(String(projects[0].id)))!
 // Draft restore uses native operation and its cloned validation req, not a
 // server trust token; no public pointer is switched.
 const beforeDraft=(await coordinator.active()).descriptor
 await restoreVersionOperation({collection:payload.collections.projects,id:versionId,draft:true,req:await createLocalReq({user},payload),overrideAccess:false})
 assert.deepEqual((await coordinator.active()).descriptor,beforeDraft)
 assert.notEqual((await native.inspect(String(projects[0].id)))!.state.revision,afterRestore.state.revision)
 // Incomplete draft does not need ready assets to unpublish/delete.
 await payload.update({collection:'projects',id:projects[0].id,user,overrideAccess:false,draft:true,data:{releaseContent:null,releaseAssets:[],_status:'draft'}})
 assert.equal((await coordinator.execute(await intent(projects[0].id,'unpublish'))).status,'delivered')
 assert.equal((await coordinator.execute(await intent(projects[1].id,'delete'))).status,'delivered')
 assert.equal((await coordinator.active()).generation.projects.length,0)
 assert.equal((await coordinator.status({actor:String(user.id),target:String(projects[1].id)}))[0].operation,'delete')
 console.log('PASS: native revision/transaction, target-only pending retry, guard/bulk, normalization, historical/draft restore, incomplete unpublish/delete and empty delivery')
}finally{await payload.destroy()}
