import type {ProjectDocument} from '../../../src/lib/project-contract'
import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import {mkdtemp,writeFile,mkdir,readFile} from 'node:fs/promises'
import {bindImage,type Material} from '../src/authoring/materials'
import {bindPackage,type PackageMaterial} from '../src/authoring/packages'
import type {Value} from '../src/authoring/model'
import {getPayload} from 'payload'
import config from '../src/payload.config'
import {exportPayloadPublished,readReleaseProjects,prepareReleaseRecords} from '../src/release-export'
import {createProjectSnapshot} from '../../portfolio-release/project-snapshot.mjs'
import {writeSnapshotDirectory} from '../../portfolio-release/snapshot-directory.mjs'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const payload=await getPayload({config})
try{
 const user=(await payload.find({collection:'users',where:{email:{equals:'editor@example.test'}}})).docs[0]
 assert.ok(user)
 const prepared=await exportPayloadPublished({payload,user,dataRoot:root})
 const records=await readReleaseProjects(payload,user,'published')
 for(const id of [1,2]){
  const baseline=await payload.findByID({collection:'projects',id,user,overrideAccess:false,draft:false})
  try {
   const fixture=JSON.parse(await readFile(path.join(root,id===1?'package-http-proof.json':'material-http-proof.json'),'utf8')) as {material:Material & PackageMaterial}
   const content=id===1?bindPackage(baseline.releaseContent as Value,['redesign','hero','scenes',0,'source'],fixture.material):bindImage(baseline.releaseContent as Value,['redesign','card','preview','back'],fixture.material)
   await payload.update({collection:'projects',id,user,overrideAccess:false,data:{releaseContent:content,_status:'published'}})
   await payload.update({collection:'projects',id,user,overrideAccess:false,data:{slug:'renamed-case-'+id,_status:'published'}})
   const live=await exportPayloadPublished({payload,user,dataRoot:root})
   assert.ok(live.projects.some((project:ProjectDocument)=>project.slug==='renamed-case-'+id))
  }finally{await payload.update({collection:'projects',id,user,overrideAccess:false,data:{slug:baseline.slug,releaseContent:baseline.releaseContent,releaseAssets:baseline.releaseAssets,releaseExternalDependencies:baseline.releaseExternalDependencies,_status:'published'}})}
  const renamed=records.map(record=>record.id===id?{...record,slug:'renamed-case-'+id}:record)
  const core=await prepareReleaseRecords({payload,user,dataRoot:root,records:renamed})
  const snapshot=createProjectSnapshot({...core,provenance:prepared.provenance})
  assert.ok(snapshot.projects.find((project:ProjectDocument)=>project.slug==='renamed-case-'+id))
  assert.ok(core.assets.some(asset=>asset.publicPath.startsWith('/assets/projects/renamed-case-'+id+'/')))
  assert.deepEqual((await exportPayloadPublished({payload,user,dataRoot:root})).projects,prepared.projects)
 }
 await mkdir(path.join(root,'exports'),{recursive:true})
 const parent=await mkdtemp(path.join(root,'exports/site-')),destination=path.join(parent,'snapshot')
 await writeSnapshotDirectory(destination,prepared)
 await writeFile('/private/tmp/payload-site-build-snapshot.txt',destination)
 console.log('PASS: published native snapshot exported, CMS stopped before site build')
}finally{await payload.destroy()}
