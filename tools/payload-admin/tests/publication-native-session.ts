import assert from 'node:assert/strict'
import path from 'node:path'
import {mkdir,writeFile} from 'node:fs/promises'
import {preparePreviewRelease} from '../src/preview'
import {artifactFiles} from '../../portfolio-runtime/artifact.mjs'
import sharp from 'sharp'
import {createHash} from 'node:crypto'
import {getPayload,createLocalReq,restoreVersionOperation} from 'payload'
import config from '../src/payload.config'
import {registerDraftCapture} from '../src/publication/draft-capture'
import {nativeSelection} from '../src/publication/selection'
import {captureDraftResponse} from '../src/publication/rest-save'
import {boundedPublicationJSON} from '../src/publication/http'
import {createNativePublicationAdapter,authorDigest} from '../src/publication/native'
import {createPublicationCoordinator,PublicationError,type PublicationIntent} from '../../portfolio-delivery/coordinator.mjs'
import {DELIVERY_CAPABILITIES,canonicalJSON,contentHash} from '../../portfolio-delivery/contract.mjs'
import {fixture} from '../../../tests/fixtures/portfolio-delivery.mjs'
import type {Project} from '../src/payload-types'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT!)
assert.match(path.basename(root),/^des-art-payload-test-/)
const configuration=await config,collection=configuration.collections.find(item=>item.slug==='projects')!
assert.ok(collection.hooks.beforeOperation.length)
assert.ok(collection.hooks.afterOperation.length)
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
 const publicRoot=path.join(root,'public-delivery'),privateRoot=path.join(root,'delivery')
 const {createGenerationReader}=await import('../../portfolio-delivery/reader.mjs')
 const reader=createGenerationReader({root:publicRoot,renderer})
 let fail=false
 const coordinator=createPublicationCoordinator({publicRoot,privateRoot,renderer,native,probe:async request=>{
  if(fail&&request.kind==='candidate')throw new Error('Injected readiness failure')
  if(request.kind==='candidate')await reader.readGeneration(request.contentId);else assert.deepEqual((await reader.readActive({allowLastGood:false})).descriptor,request.descriptor)
 }})
 await coordinator.initialize({prepared:{projects:[],assets:[],externalDependencies:[]},mapping:[]})
 const artifactRoot=path.join(root,'code-artifact')
 for(const file of ['server.mjs','site/index.html','preview/index.html']){await mkdir(path.dirname(path.join(artifactRoot,file)),{recursive:true});await writeFile(path.join(artifactRoot,file),'Synthetic renderer fixture')}
 const codeFiles=await artifactFiles(artifactRoot),portfolioBuildId={sourceSha:'b'.repeat(40),artifactSha256:contentHash(canonicalJSON({files:codeFiles,renderer}))}
 await writeFile(path.join(artifactRoot,'release-manifest.json'),JSON.stringify({version:1,portfolioBuildId,renderer,sourceDirty:true,files:codeFiles}))
 const releaseFile=path.join(root,'active-code.json')
 await writeFile(releaseFile,JSON.stringify({version:1,artifactRoot,portfolioBuildId,renderer}))
 await mkdir(root+'-lock');const token='owned-fixture-writer-token'
 await writeFile(path.join(root+'-lock','owner.json'),JSON.stringify({pid:process.ppid,childPID:process.pid,token}))
 process.env.PAYLOAD_WRITER_TOKEN=token;process.env.PORTFOLIO_CONTENT_ROOT=publicRoot;process.env.PORTFOLIO_ACTIVE_RELEASE=releaseFile;process.env.PORTFOLIO_INTERNAL_ORIGIN='http://127.0.0.1:41742/'

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
 const selection=nativeSelection(new URLSearchParams('where[and][0][id][in][0]=1&where[and][0][id][in][1]=2&where[and][1][_status][equals]=draft'))
 assert.deepEqual(selection.ids,['1','2'])
 assert.deepEqual(JSON.parse(JSON.stringify(selection.where)),{and:[{id:{in:['1','2']}},{_status:{equals:'draft'}}]})
 for(const query of ['where[id][in]=0','where[or][0][id][in]=1','where[__proto__][id][in]=1','where[id][in][101]=1','where[id][in]=1&where[id][in]=2','where[_status][equals]=draft'])assert.throws(()=>nativeSelection(new URLSearchParams(query)))
 const capture=registerDraftCapture(String(user.id),async(req,id)=>{const selected=(await native.inspect(id,req))!;return {id,state:selected.state}})
 try {
  const req=await createLocalReq({user,req:{headers:capture.headers(new Headers())}},payload)
  await payload.update({collection:'projects',id:projects[0].id,draft:true,overrideAccess:false,req,data:{title:projects[0].title,_status:'draft'}})
  assert.deepEqual(capture.result(),{id:String(projects[0].id),state:(await native.inspect(String(projects[0].id)))!.state})
 }finally{capture.close()}
 const login=await payload.login({collection:'users',data:{email:user.email,password:'Disposable-fixture-long-passphrase'}})
 const origin='http://127.0.0.1:41741',url=origin+'/api/projects/'+projects[0].id+'?draft=true&depth=0'
 const headers={host:'127.0.0.1:41741',origin,cookie:configuration.cookiePrefix+'-token='+login.token,'content-type':'application/json'}
 const draftRequest=()=>new Request(url,{method:'PATCH',headers,body:JSON.stringify({_status:'draft',title:projects[0].title})})
 const handler=async(request:Request)=>{
  const req=await createLocalReq({user,req:{headers:request.headers}},payload)
  const data=await request.json()
  const doc=await payload.update({collection:'projects',id:projects[0].id,overrideAccess:false,draft:true,req,data})
  return Response.json({doc})
 }
 const savedResponse=await captureDraftResponse(draftRequest(),['projects',String(projects[0].id)],handler)
 assert.equal(savedResponse.status,200,await savedResponse.clone().text())
 assert.equal(savedResponse.headers.get('X-Payload-Saved-Revision'),(await native.inspect(String(projects[0].id)))!.state.revision)
 const racing=await captureDraftResponse(draftRequest(),['projects',String(projects[0].id)],async request=>{
  const response=await handler(request)
  await payload.update({collection:'projects',id:projects[0].id,user,overrideAccess:false,draft:true,data:{title:projects[0].title+' later',_status:'draft'}})
  return response
 })
 assert.equal(racing.status,409)
 assert.equal((await racing.json()).error,'saved-revision-changed')
 assert.equal(racing.headers.get('X-Payload-Saved-Revision'),null)
 const wrongOrigin=new Request(url,{method:'PATCH',headers:{...headers,origin:'https://outside.test'},body:'{}'})
 assert.equal((await captureDraftResponse(wrongOrigin,['projects',String(projects[0].id)],()=>{throw new Error('Must not mutate')})).status,403)
 const unauthenticated=new Request(url,{method:'PATCH',headers:{...headers,cookie:''},body:'{}'})
 assert.equal((await captureDraftResponse(unauthenticated,['projects',String(projects[0].id)],()=>{throw new Error('Must not mutate')})).status,401)
 await assert.rejects(()=>boundedPublicationJSON(new Request(origin,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({data:'x'.repeat(17000)})})))
 await payload.update({collection:'projects',id:projects[0].id,user,overrideAccess:false,draft:true,data:{title:projects[0].title,_status:'draft'}})
 const historicalDraft=(await native.inspect(String(projects[0].id)))!.versionId
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
 const publishedPreview=(await preparePreviewRelease({payload,user,id:chosen.target,mode:'published',dataRoot:root}))!
 assert.equal(publishedPreview.projects.find(project=>project.slug===projects[0].slug)!.title,projects[0].title)
 const selectedPreview=(await preparePreviewRelease({payload,user,id:String(projects[1].id),mode:'draft',dataRoot:root}))!
 assert.equal(selectedPreview.projects.find(project=>project.slug===projects[0].slug)!.title,projects[0].title)

 assert.deepEqual(await coordinator.nativeReplay({actor:String(user.id),target:chosen.target,operation:'publish'}),chosen)
 await assert.rejects(()=>coordinator.retry(chosen.operationId,'999'),error=>error instanceof PublicationError&&error.code==='operation-owner-conflict')
 await assert.rejects(()=>coordinator.retry('missing_operation_123456',String(user.id)),error=>error instanceof PublicationError&&error.code==='operation-not-found')
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
 // Drizzle catches a failed session commit and resolves its public helper.
 // Inject there so the real adapter rolls back SQLite; fresh DB confirmation
 // must prevent a false delivered receipt despite the swallowed rejection.
 const failedCommitIntent=await intent(projects[0].id),beforeFailedCommit=(await native.inspect(String(projects[0].id)))!,beforeFailedActive=(await coordinator.active()).descriptor,beforeFailedVersions=(await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs
 const adapterCommit=payload.db.commitTransaction;let injectedCommit=false,commitHelperResolved=false
 payload.db.commitTransaction=async incomingID=>{
  const id=await incomingID,session=payload.db.sessions?.[String(id)];assert.ok(session,'Expected a real SQLite transaction session')
  const resolve=session.resolve;session.resolve=async()=>{injectedCommit=true;throw new Error('Injected SQLite session commit failure')}
  try{await adapterCommit.call(payload.db,incomingID);commitHelperResolved=true}finally{session.resolve=resolve}
 }
 try{assert.equal((await coordinator.execute(failedCommitIntent)).status,'committing')}finally{payload.db.commitTransaction=adapterCommit}
 assert.equal(injectedCommit,true);assert.equal(commitHelperResolved,true)
 assert.deepEqual((await native.inspect(String(projects[0].id)))!.state,beforeFailedCommit.state)
 assert.equal((await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs,beforeFailedVersions)
 assert.deepEqual((await coordinator.active()).descriptor,beforeFailedActive)
 assert.equal((await coordinator.execute(failedCommitIntent)).status,'delivered')
 assert.equal((await payload.findVersions({collection:'projects',user,overrideAccess:false,where:{parent:{equals:projects[0].id}}})).totalDocs,beforeFailedVersions+1)
 assert.equal((await coordinator.active()).descriptor.activationSeq,beforeFailedActive.activationSeq+1)
 console.log('PASS: real SQLite session commit rejection is swallowed by Drizzle but detected by native durability confirmation; explicit retry commits once')
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
 // Native normal restore of a selected historical draft has an unpublish
 // effect; preserve that exact historical selection without exporting assets.
 assert.equal((await coordinator.execute(await intent(projects[0].id,'restore',historicalDraft))).status,'delivered')
 assert.equal((await coordinator.active()).generation.projects.some(project=>project.slug===projects[0].slug),false)
 assert.equal((await native.inspect(String(projects[0].id)))!.record._status,'draft')
 assert.equal((await coordinator.execute(await intent(projects[0].id))).status,'delivered')
 // Incomplete draft does not need ready assets to unpublish/delete.
 await payload.update({collection:'projects',id:projects[0].id,user,overrideAccess:false,draft:true,data:{releaseContent:null,releaseAssets:[],_status:'draft'}})
 const incompletePublished=(await preparePreviewRelease({payload,user,id:String(projects[0].id),mode:'published',dataRoot:root}))!
 assert.equal(incompletePublished.projects.find(project=>project.slug===projects[0].slug)!.title,projects[0].title)
 assert.equal((await coordinator.execute(await intent(projects[0].id,'unpublish'))).status,'delivered')
 const deleteIntent=await intent(projects[1].id,'delete');fail=true
 assert.equal((await coordinator.execute(deleteIntent)).status,'pending')
 assert.equal(await native.inspect(deleteIntent.target),null)
 const deletedPublished=(await preparePreviewRelease({payload,user,id:deleteIntent.target,mode:'published',dataRoot:root}))!
 assert.equal(deletedPublished.projects.find(project=>project.slug===projects[1].slug)!.title,projects[1].title)
 assert.equal(await preparePreviewRelease({payload,user,id:deleteIntent.target,mode:'draft',dataRoot:root}),null)
 fail=false;assert.equal((await coordinator.execute(deleteIntent)).status,'delivered')
 assert.equal((await coordinator.active()).generation.projects.length,0)
 assert.equal((await coordinator.status({actor:String(user.id),target:String(projects[1].id)}))[0].operation,'delete')
 console.log('PASS: native revision/transaction, target-only pending retry, guard/bulk, normalization, historical/draft restore, incomplete unpublish/delete and empty delivery')
}finally{await payload.destroy()}
