import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import {readFile} from 'node:fs/promises'
import {readPublishedSiteContent} from '../src/site/read-content'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const {getPayload}=await import('payload'),{default:config}=await import('../src/payload.config')
const payload=await getPayload({config})
const buildId=await readFile(path.resolve(import.meta.dirname,'../.next/BUILD_ID'),'utf8')
try{
 const user=(await payload.find({collection:'users',where:{email:{equals:'editor@example.test'}}})).docs[0]
 assert.ok(user)
 for(const id of [1,2]){
  const access={user,overrideAccess:false},baseline=await payload.findByID({collection:'projects',id,...access,draft:false})
  try{
   const before=await readPublishedSiteContent(payload)
   await payload.update({collection:'projects',id,...access,draft:true,data:{title:'Приватный черновик '+id,_status:'draft'}})
   assert.deepEqual(await readPublishedSiteContent(payload),before)
   await payload.update({collection:'projects',id,...access,data:{title:'Применённый проект '+id,_status:'published'}})
   const after=await readPublishedSiteContent(payload)
   assert.equal(after.projects.find(item=>item.slug===baseline.slug)?.title,'Применённый проект '+id)
   assert.notEqual(after.revision,before.revision)
   assert.ok(!JSON.stringify(after).includes('Приватный черновик'))
   assert.equal(await readFile(path.resolve(import.meta.dirname,'../.next/BUILD_ID'),'utf8'),buildId)
  }finally{await payload.update({collection:'projects',id,...access,data:{title:baseline.title,_status:'published'}})}
 }
 console.log('PASS: both native project drafts stay private; native Publish immediately changes public DTO; application build unchanged; fixture titles restored')
}finally{await payload.destroy()}
