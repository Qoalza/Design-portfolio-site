import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {getPayload} from 'payload'
import config from '../src/payload.config'
import {exportPayloadPublished,releaseProjectDocument} from '../src/release-export'
import type {PackageMaterial} from '../src/authoring/packages'
import type {Project} from '../src/payload-types'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const proof=JSON.parse(await readFile(path.join(root,'package-http-proof.json'),'utf8')) as {material:PackageMaterial;baseline:Project;inputs:{path:string;bytes:string}[]}
const payload=await getPayload({config})
try {
 const user=(await payload.find({collection:'users',where:{email:{equals:'editor@example.test'}}})).docs[0]
 const access={user:{...user,collection:'users' as const},overrideAccess:false}
 const before=await exportPayloadPublished({payload,user,dataRoot:root})
 assert.equal(before.assets.some(asset=>asset.publicPath.startsWith(proof.material.source.assetBase)),false)
 const draft=await payload.findByID({collection:'projects',id:1,...access,draft:true,depth:0})
 const baselineHero=releaseProjectDocument(proof.baseline).redesign!.hero
 const draftHero=releaseProjectDocument(draft).redesign!.hero
 assert.equal(draftHero.kind,'layout');assert.equal(baselineHero.kind,'layout')
 if(draftHero.kind!=='layout'||baselineHero.kind!=='layout') throw new Error('Expected fixture layout')
 assert.deepEqual(draftHero.adaptives,baselineHero.adaptives)
 assert.deepEqual(draftHero.scenes.map(scene=>scene.adaptives),baselineHero.scenes.map(scene=>scene.adaptives))
 await payload.update({collection:'projects',id:1,...access,data:{releaseContent:draft.releaseContent,_status:'published'}})
 try {
 const exported=await exportPayloadPublished({payload,user,dataRoot:root})
 for(const input of proof.inputs) {
  const asset=exported.assets.find(item=>item.publicPath===proof.material.source.assetBase+input.path)
  assert.ok(asset)
  assert.deepEqual(asset.bytes,Buffer.from(input.bytes,'base64'))
 }
 assert.equal(exported.projects.some(project=>'_payloadEditor' in project),false)
 assert.equal(exported.assets.filter(asset=>asset.publicPath.startsWith(proof.material.source.assetBase)).length,proof.inputs.length)
 console.log('PASS: draft package excluded; native publication exports original HTML/CSS/JS/PNG bytes, complete manifest and unchanged adaptives; private authoring omitted')
 }finally{await payload.update({collection:'projects',id:1,...access,data:{releaseContent:proof.baseline.releaseContent,releaseAssets:proof.baseline.releaseAssets,releaseExternalDependencies:proof.baseline.releaseExternalDependencies,_status:'published'}})}
}finally{await payload.destroy()}
