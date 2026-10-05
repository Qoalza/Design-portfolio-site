import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { createHash,randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { exportPayloadPublished, readReleaseProjects, releaseProjectDocument } from '../src/release-export'
import { exportApprovedRedesign } from '../../concept-v2/export-approved-content.mjs'
import { backup, verifyBackup } from '../scripts/storage.mjs'
import { locations,acquire } from '../scripts/state.mjs'
import {bootstrapProductionContent} from '../scripts/bootstrap-content'
import { writeSnapshotDirectory, readSnapshotDirectory } from '../../portfolio-release/snapshot-directory.mjs'

const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const {getPayload}=await import('payload'),{default:config}=await import('../src/payload.config')
const repoRoot=path.resolve(import.meta.dirname,'../../..')
const approved=await exportApprovedRedesign({repoRoot})
const lock=await acquire(locations(root))
const payload=await getPayload({config})
try {
 const phase=process.argv[2]
 const users=await payload.find({collection:'users',where:{email:{equals:'release-proof@example.test'}}})
 const user=users.docs[0]??await payload.create({collection:'users',data:{email:'release-proof@example.test',password:randomBytes(32).toString('hex')}})
 const access={user:{...user,collection:'users' as const},overrideAccess:false}
 if(phase==='seed'){
  const siteRoot=path.join(root,'baseline-input'),expectedSha='a'.repeat(40)
  await writeSnapshotDirectory(siteRoot,approved)
  const snapshotBytes=await readFile(path.join(siteRoot,'snapshot.json'))
  const expectedContentHash=createHash('sha256').update(snapshotBytes).digest('hex')
  await writeFile(path.join(siteRoot,'site-manifest.json'),JSON.stringify({version:1,buildSha:expectedSha,sourceDirty:false,snapshotSha256:expectedContentHash,provenance:approved.provenance,files:approved.assets.map(asset=>({path:asset.publicPath.slice(1),sha256:asset.sha256,bytes:asset.bytes.length}))}))
  const source={payload,user,dataRoot:root,siteRoot,expectedSha,expectedContentHash}
  await assert.rejects(bootstrapProductionContent({...source,expectedContentHash:'f'.repeat(64)}),/identity/)
  assert.equal((await payload.find({collection:'media',...access})).totalDocs,0)
  const orphan=path.join(root,'media/orphan-fixture');await writeFile(orphan,'fixture')
  await assert.rejects(bootstrapProductionContent(source),/empty physical/);await unlink(orphan)
  const imported=await bootstrapProductionContent(source)
  assert.equal(imported.projectIds.length,2);assert.equal(imported.assets,approved.assets.length)
  await assert.rejects(bootstrapProductionContent(source),/empty/)
  await mkdir(path.join(root,'exports'))
  const exported=await exportPayloadPublished({payload,user,dataRoot:root})
  assert.deepEqual(exported.projects,approved.projects)
  assert.equal(exported.assets.length,approved.assets.length)
  for(const asset of exported.assets)assert.deepEqual(asset.bytes,approved.assets.find(a=>a.publicPath===asset.publicPath)!.bytes)
  await writeSnapshotDirectory(path.join(root,'exports/baseline'),exported)
  const state=locations(root),backupId=await backup(state),saved=await verifyBackup(state,backupId)
  const packageBinding=(await readReleaseProjects(payload,user,'published')).flatMap(record=>record.releaseAssets??[]).find(asset=>asset.file.relationTo==='project-files')!
  const packageFile=await payload.findByID({collection:'project-files',id:typeof packageBinding.file.value==='object'?packageBinding.file.value.id:packageBinding.file.value,...access})
  assert.deepEqual(await readFile(path.join(saved,'project-files',packageFile.filename!)),approved.assets.find(asset=>asset.publicPath===packageBinding.publicPath)!.bytes)
  console.log('PASS: native Payload saved both complete projects and exact-identity operator bootstrap saved both projects and all asset bindings; invalid source/retry rejected; export matches approved bytes')
 }else{
  const baseline=await exportPayloadPublished({payload,user,dataRoot:root})
  assert.deepEqual(baseline.projects,approved.projects)
  await assert.rejects(readReleaseProjects(payload,null,'published'))
  await assert.rejects(payload.find({collection:'project-files',overrideAccess:false}))
  const records=await readReleaseProjects(payload,user,'published')
  const corvo=records.find(p=>p.slug==='corvo')!,radio=records.find(p=>p.slug==='sarafan-radio')!
  const changedRadio=releaseProjectDocument(radio)
  changedRadio.title='Payload proof title'
  changedRadio.description='Payload proof description'
  changedRadio.materials={projectState:'completed',fileState:'available',figmaUrl:'https://example.com/payload-proof'}
  assert.equal(changedRadio.redesign!.hero.kind,'raster')
  const raster=changedRadio.redesign!.hero
  if(raster.kind!=='raster')throw new Error('Wrong fixture Hero')
  raster.slides.reverse();raster.initialSlideId=raster.slides[0].id;raster.slides[0].title='Payload proof initial screen'
  const replacement=await sharp({create:{width:4096,height:2958,channels:4,background:'#789abc'}}).png().toBuffer()
  const image=await payload.create({collection:'media',...access,data:{alt:'Payload proof replacement'},file:{name:'payload-proof.png',mimetype:'image/png',size:replacement.length,data:replacement}})
  const oldPath=raster.slides[0].image.src
  const newPath='/assets/projects/sarafan-radio/redesign/payload-proof.png'
  raster.slides[0].image={...raster.slides[0].image,src:newPath,alt:'Payload proof replacement'}
  await payload.update({collection:'projects',id:radio.id,...access,data:{title:changedRadio.title,releaseContent:changedRadio,releaseAssets:radio.releaseAssets!.map(asset=>asset.publicPath===oldPath?{publicPath:newPath,file:{relationTo:'media' as const,value:image.id}}:asset),_status:'published'}})
  const changedCorvo=releaseProjectDocument(corvo)
  const layout=changedCorvo.redesign!.hero
  if(layout.kind!=='layout')throw new Error('Wrong fixture Hero')
  layout.initialSceneId='statistics';layout.adaptives.enabled=['desktop'];layout.scenes[1].title='Payload proof layout source'
  const source=layout.scenes[1].source
  if(source.kind!=='package')throw new Error('Wrong source fixture')
  source.entry='authorization/index.html'
  await payload.update({collection:'projects',id:corvo.id,...access,data:{releaseContent:changedCorvo,_status:'published'}})
  const changed=await exportPayloadPublished({payload,user,dataRoot:root})
  assert.equal(changed.projects.find(p=>p.slug==='sarafan-radio')!.title,'Payload proof title')
  assert.deepEqual(changed.assets.find(a=>a.publicPath===newPath)!.bytes,replacement)
  await writeSnapshotDirectory(path.join(root,'exports/changed'),changed)
  const tiny=await sharp({create:{width:1,height:1,channels:4,background:'#abcdef'}}).png().toBuffer()
  const tinyFile=await payload.create({collection:'media',...access,data:{alt:'Invalid geometry fixture'},file:{name:'tiny.png',mimetype:'image/png',size:tiny.length,data:tiny}})
  const goodRadio=(await readReleaseProjects(payload,user,'published')).find(p=>p.slug==='sarafan-radio')!
  const goodSnapshot=await readFile(path.join(root,'exports/changed/snapshot.json'))
  // A damaged bitmap may retain a valid IHDR size. Export must decode its pixels.
  const nativeImage=path.join(root,'media',image.filename!)
  await writeFile(nativeImage,replacement.subarray(0,64))
  await assert.rejects(exportPayloadPublished({payload,user,dataRoot:root}))
  assert.deepEqual(await readFile(path.join(root,'exports/changed/snapshot.json')),goodSnapshot)
  await writeFile(nativeImage,replacement)

  await assert.rejects(payload.update({collection:'projects',id:radio.id,...access,data:{releaseAssets:goodRadio.releaseAssets!.map(asset=>asset.publicPath===newPath?{publicPath:newPath,file:{relationTo:'media' as const,value:tinyFile.id}}:asset),_status:'published'}}),/Материалы/)
  assert.deepEqual((await exportPayloadPublished({payload,user,dataRoot:root})).projects,changed.projects)
  assert.deepEqual(await readFile(path.join(root,'exports/changed/snapshot.json')),goodSnapshot)
  await payload.update({collection:'projects',id:radio.id,...access,data:{releaseAssets:goodRadio.releaseAssets,_status:'published'}})

  await payload.update({collection:'projects',id:radio.id,...access,draft:true,data:{title:'Draft must not publish',releaseContent:{...changedRadio,description:'Private draft text'},_status:'draft'}})
  const publishedAfterDraft=await exportPayloadPublished({payload,user,dataRoot:root})
  assert.deepEqual(publishedAfterDraft.projects,changed.projects)
  const draft=await readReleaseProjects(payload,user,'draft')
  assert.equal(releaseProjectDocument(draft.find(p=>p.slug==='sarafan-radio')!).title,'Draft must not publish')
  const invalid={...changedRadio,redesign:{...changedRadio.redesign!,hero:{kind:'raster',slides:[]}}}
  await assert.rejects(payload.update({collection:'projects',id:radio.id,...access,data:{releaseContent:invalid,_status:'published'}}))
  const sharedFile=corvo.releaseAssets!.find(a=>a.file.relationTo==='project-files')!.file
  const sharedId=typeof sharedFile.value==='object'?sharedFile.value.id:sharedFile.value
  await assert.rejects(payload.delete({collection:'project-files',id:sharedId,...access}),/используется/)
  await assert.rejects(payload.delete({collection:'media',id:image.id,...access}),/используется/)
  const good=await readFile(path.join(root,'exports/changed/snapshot.json'))
  await assert.rejects(writeSnapshotDirectory(path.join(root,'exports/changed'),{...changed,assets:changed.assets.slice(1)}))
  assert.deepEqual(await readFile(path.join(root,'exports/changed/snapshot.json')),good)
  await unlink(path.join(root,'media',image.filename!))
  await assert.rejects(exportPayloadPublished({payload,user,dataRoot:root}))
  assert.deepEqual(await readFile(path.join(root,'exports/changed/snapshot.json')),good)
  const independent=await readSnapshotDirectory(path.join(root,'exports/changed'))
  assert.deepEqual(independent.projects,changed.projects)
  await writeFile(path.join(root,'proof-result.json'),JSON.stringify({projects:changed.projects.map(p=>p.slug),assets:changed.assets.length,publishedIndependentOfDrafts:true,reopen:true,invalidKeepsLastGood:true}))
  console.log('PASS: fresh SQLite process, edits to both Hero modes/content/image, private drafts, guarded files, invalid/missing files retain good export')
 }
}finally{await payload.destroy();await lock.release()}
