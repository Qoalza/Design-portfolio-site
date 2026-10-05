import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import {getPayload} from 'payload'
import config from '../src/payload.config'
import {preparePreviewRelease} from '../src/preview'
import {exportPayloadPublished,prepareReleaseRecords,readReleaseProjects} from '../src/release-export'
import {replaceValue} from '../src/authoring/model'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const payload=await getPayload({config})
try {
 const user=(await payload.find({collection:'users',where:{email:{equals:'editor@example.test'}}})).docs[0]
 const access={user:{...user,collection:'users' as const},overrideAccess:false}
 const records=await readReleaseProjects(payload,user,'published')
 const published=await exportPayloadPublished({payload,user,dataRoot:root})
 const core=await prepareReleaseRecords({payload,user,dataRoot:root,records})
 assert.deepEqual(core.projects,published.projects)
 assert.deepEqual(core.assets,published.assets)
 await assert.rejects(preparePreviewRelease({payload,user:null,id:'1',mode:'draft',dataRoot:root}),/authentication/)
 assert.equal(await preparePreviewRelease({payload,user,id:'0',mode:'draft',dataRoot:root}),null)
 for(const id of [1,2]) {
 const baseline=await payload.findByID({collection:'projects',id,...access,draft:false})
 const original=baseline.releaseContent
 const changed=replaceValue(original,['description'],`Selected private draft ${id}`)
 await payload.update({collection:'projects',id,...access,draft:true,data:{releaseContent:changed,_status:'draft'}})
 try {
 const draft=await preparePreviewRelease({payload,user,id:String(id),mode:'draft',dataRoot:root})
 const localPublished=await preparePreviewRelease({payload,user,id:String(id),mode:'published',dataRoot:root})
 assert.ok(draft);assert.ok(localPublished)
 assert.equal(draft.source.mode,'draft');assert.equal(draft.source.authorStatus,'draft')
 assert.notEqual(draft.revision,localPublished.revision)
 assert.equal(draft.projects.find(project=>project.slug===baseline.slug)!.description,`Selected private draft ${id}`)
 assert.deepEqual(localPublished.projects,published.projects)
 assert.equal('provenance' in draft,false)
 assert.equal(draft.projects.some(project=>'_payloadEditor' in project),false)
 assert.deepEqual((await exportPayloadPublished({payload,user,dataRoot:root})).projects,published.projects)
 const missing=records.map(project=>project.id===id?{...project,releaseAssets:[]}:project)
 await assert.rejects(prepareReleaseRecords({payload,user,dataRoot:root,records:missing}),/Missing Payload/)
 }finally{await payload.update({collection:'projects',id,...access,draft:true,data:{releaseContent:original,_status:'draft'}})}
 }
 console.log('PASS: shared export/preview mapper, authenticated selected draft revision, separate published data, missing assets rejected, no publication provenance/private state in preview data')
}finally{await payload.destroy()}
