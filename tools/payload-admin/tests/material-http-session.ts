import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { bindImage, type Material } from '../src/authoring/materials'
import type { Value } from '../src/authoring/model'
const root = path.resolve(process.env.PAYLOAD_LOCAL_ROOT || '')
assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const origin = 'http://127.0.0.1:41741'
const login = await fetch(`${origin}/api/users/login`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})})
assert.equal(login.status,200)
const {token} = await login.json() as {token:string}
assert.ok(token)
const auth = {Authorization:`JWT ${token}`}
type Project = {releaseContent:Value;releaseAssets:{publicPath:string}[]}
async function project(draft:boolean):Promise<Project> {
 const response=await fetch(`${origin}/api/projects/2?depth=0&draft=${draft}`,{headers:auth})
 assert.equal(response.status,200)
 return response.json()
}
const baseline=await project(false), draftBefore=await project(true)
const bytes=await readFile('/private/tmp/payload-screen-upload-fixture.png')
function form() {
 const data=new FormData()
 data.set('file',new File([new Uint8Array(bytes)],'screen-fixture.png',{type:'image/png'}))
 data.set('projectId','2');data.set('context','screen');data.set('slot','raster')
 return data
}
const anonymous=await fetch(`${origin}/api/materials/images`,{method:'POST',body:form(),headers:{Origin:origin}})
assert.equal(anonymous.status,401)
const foreign=await fetch(`${origin}/api/materials/images`,{method:'POST',body:form(),headers:{...auth,Origin:'https://foreign.example'}})
assert.equal(foreign.status,403)
const upload=await fetch(`${origin}/api/materials/images`,{method:'POST',body:form(),headers:{...auth,Origin:origin}})
const result=await upload.json() as {material?:Material;error?:string}
assert.equal(upload.status,200,result.error ?? 'Image upload failed')
const material=result.material!
assert.equal(material.report.reason,'verified-lossless')
assert.equal(material.image.width,2048);assert.equal(material.image.height,1479)
assert.notEqual(material.original.value,material.prepared.value)
const bound=bindImage(draftBefore.releaseContent,['redesign','hero','slides',0,'image'],material)
const save=await fetch(`${origin}/api/projects/2?draft=true`,{method:'PATCH',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({releaseContent:bound,_status:'draft'})})
assert.equal(save.status,200,await save.text())
const reopened=await project(true)
assert.deepEqual(reopened.releaseContent,bound)
assert.ok(reopened.releaseAssets.some(asset=>asset.publicPath===material.publicPath))
assert.deepEqual((await project(false)).releaseContent,baseline.releaseContent)
for(const id of [material.original.value,material.prepared.value]) {
 const deletion=await fetch(`${origin}/api/media/${id}`,{method:'DELETE',headers:auth})
 assert.equal(deletion.status,409)
}
await writeFile(path.join(root,'material-http-proof.json'),JSON.stringify({material,baseline,draftBefore}))
console.log('PASS: authenticated upload, origin rejection, lossless preparation, draft persistence, automatic binding, published isolation, original/prepared deletion guards')
