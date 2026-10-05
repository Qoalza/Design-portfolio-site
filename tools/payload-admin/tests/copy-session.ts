import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import {getPayload} from 'payload'
import config from '../src/payload.config'
import {appendCopy,setOptionalCopy,removeCopy} from '../src/authoring/copy'
import {replaceValue,type Value} from '../src/authoring/model'
import {releaseProjectDocument} from '../src/release-export'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const payload=await getPayload({config})
try {
const user=(await payload.find({collection:'users',where:{email:{equals:'editor@example.test'}}})).docs[0]
const access={user:{...user,collection:'users' as const},overrideAccess:false}
for(const id of [1,2]) {
 const baseline=await payload.findByID({collection:'projects',id,...access,draft:false})
 const source=baseline.releaseContent as Value
 const summary=['redesign','page','summary'] as const
 let changed=appendCopy(source,summary,'paragraph')
 const count=(releaseProjectDocument(baseline).redesign!.page.summary).length
 changed=replaceValue(changed,[...summary,count,0,'text'],'Сохранённый абзац тестового проекта')
 changed=appendCopy(changed,[...summary,count],'link')
 changed=replaceValue(changed,[...summary,count,1,'text'],'Локальная ссылка')
 changed=replaceValue(changed,[...summary,count,1,'href'],'/projects/example')
 changed=setOptionalCopy(changed,[...summary,count,0],'marks',['strong','underline'])
 changed=setOptionalCopy(changed,[],'subtitle','Дополнительная подпись')
 await payload.update({collection:'projects',id,...access,draft:true,data:{releaseContent:changed,_status:'draft'}})
 const reopened=await payload.findByID({collection:'projects',id,...access,draft:true})
 assert.deepEqual(reopened.releaseContent,changed)
 assert.deepEqual(releaseProjectDocument(reopened).redesign!.hero,releaseProjectDocument(baseline).redesign!.hero)
 assert.deepEqual((await payload.findByID({collection:'projects',id,...access,draft:false})).releaseContent,source)
 const restored=removeCopy(changed,summary,count)
 await payload.update({collection:'projects',id,...access,draft:true,data:{releaseContent:restored,_status:'draft'}})
 await payload.update({collection:'projects',id,...access,data:{releaseContent:source,_status:'published'}})
}
console.log('PASS: both templates save/reopen added copy/link/marks/optional fields; local href validates, published/Hero preserved; disposable baseline restored')
}finally{await payload.destroy()}
