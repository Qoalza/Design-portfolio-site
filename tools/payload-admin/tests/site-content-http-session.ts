import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const origin='http://127.0.0.1:41741',build=await readFile('.next/BUILD_ID','utf8')
const login=await fetch(origin+'/api/users/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})});assert.equal(login.status,200)
const {token}=await login.json() as {token:string},auth={Authorization:`JWT ${token}`,Origin:origin,'Content-Type':'application/json'}
async function page(slug:string){const response=await fetch(origin+'/projects/'+slug);assert.equal(response.status,200);const html=await response.text();const data=JSON.parse(html.match(/<script id="portfolio-projects" type="application\/json">(.*?)<\/script>/s)![1]) as {revision:string;projects:Array<{slug:string;title:string}>};return {html,data}}
const first=await(await fetch(origin+'/')).text(),script=first.match(/<script[^>]+src="([^"]+)"/)![1]
const assetHash=async()=>createHash('sha256').update(Buffer.from(await(await fetch(origin+script)).arrayBuffer())).digest('hex')
const beforeAsset=await assetHash()
for(const id of [1,2]){
 const response=await fetch(origin+'/api/projects/'+id+'?draft=false',{headers:auth});assert.equal(response.status,200)
 const baseline=await response.json() as {slug:string;title:string}
 async function save(title:string,draft=false){const response=await fetch(origin+'/api/projects/'+id+(draft?'?draft=true':''),{method:'PATCH',headers:auth,body:JSON.stringify({title,_status:draft?'draft':'published'})});assert.equal(response.status,200)}
 try{
  const before=await page(baseline.slug)
  await save('Скрытый онлайн-черновик '+id,true)
  assert.deepEqual((await page(baseline.slug)).data,before.data)
  await save('Применено через Payload '+id)
  const after=await page(baseline.slug)
  assert.equal(after.data.projects.find(project=>project.slug===baseline.slug)?.title,'Применено через Payload '+id)
  assert.notEqual(after.data.revision,before.data.revision)
  assert.ok(after.html.includes('<title>Применено через Payload '+id+' — Product Designer</title>'))
  assert.ok(!after.html.includes('Скрытый онлайн-черновик'))
  assert.equal(await assetHash(),beforeAsset)
  assert.equal(await readFile('.next/BUILD_ID','utf8'),build)
 }finally{await save(baseline.title)}
}
assert.equal((await fetch(origin+'/api/projects')).status,403)
console.log('PASS: native authenticated Publish updates actual public HTML/data/metadata of both templates immediately; drafts stay private; compiled JS/build unchanged; fixtures restored')
