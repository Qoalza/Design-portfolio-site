import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { exportPayloadPublished } from '../src/release-export'
import type { Material } from '../src/authoring/materials'
import type { Project } from '../src/payload-types'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const proof=JSON.parse(await readFile(path.join(root,'material-http-proof.json'),'utf8')) as {material:Material;baseline:Project}
const payload=await getPayload({config})
try {
 const users=await payload.find({collection:'users',where:{email:{equals:'editor@example.test'}}})
 const user=users.docs[0]
 assert.ok(user)
 const access={user:{...user,collection:'users' as const},overrideAccess:false}
 const before=await exportPayloadPublished({payload,user,dataRoot:root})
 assert.equal(before.assets.some(a=>a.publicPath===proof.material.publicPath),false)
 const draft=await payload.findByID({collection:'projects',id:2,...access,draft:true,depth:0})
 await payload.update({collection:'projects',id:2,...access,data:{releaseContent:draft.releaseContent,_status:'published'}})
 const exported=await exportPayloadPublished({payload,user,dataRoot:root})
 assert.equal(exported.assets.filter(a=>a.publicPath===proof.material.publicPath).length,1)
 assert.equal(exported.assets.find(a=>a.publicPath===proof.material.publicPath)!.sha256,proof.material.report.prepared.sha256)
 assert.equal(exported.assets.some(a=>a.sha256===proof.material.report.original.sha256),false)
 assert.equal(exported.projects.some(p=>'_payloadEditor' in p),false)
 assert.equal(exported.assets.length,before.assets.length)
 await payload.update({collection:'projects',id:2,...access,data:{releaseContent:proof.baseline.releaseContent,_status:'published'}})
 console.log('PASS: unpublished material excluded; published prepared image exported by hash; original, replaced bitmap and private editor state excluded; disposable baseline restored')
} finally {await payload.destroy()}
