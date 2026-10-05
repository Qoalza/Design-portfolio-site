import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const origin='http://127.0.0.1:41741'
const build=await readFile('.next/BUILD_ID','utf8')
const shell=await readFile('../../.portfolio-release/preview/preview-manifest.json')
const digest=createHash('sha256').update(shell).digest('hex')
assert.equal((await fetch(origin+'/preview/projects/1',{redirect:'manual'})).status,307)
const login=await fetch(origin+'/api/users/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})})
assert.equal(login.status,200)
const {token}=await login.json() as {token:string}
const headers={Authorization:`JWT ${token}`}
for(const id of [1,2]) {
 const response=await fetch(origin+`/preview/projects/${id}?mode=draft`,{headers})
 assert.equal(response.status,200)
 const page=await response.text()
 assert.equal(page.includes('Не удалось открыть'),false)
 assert.ok(page.includes('sandbox="allow-scripts"'))
 const match=page.match(/src="(\/api\/preview-artifacts\/[a-f0-9]{64}\/projects\/[^"<]+)"/)
 assert.ok(match,'Private frame missing')
 const frame=await fetch(origin+match[1]) // Deliberately no CMS credentials in sandbox transport.
 assert.equal(frame.status,200)
 assert.ok(frame.headers.get('content-security-policy')?.includes('sandbox allow-scripts'))
 assert.equal(frame.headers.get('access-control-allow-origin'),'*')
 assert.ok(frame.headers.get('cache-control')?.includes('no-store'))
 const html=await frame.text()
 const dto=JSON.parse(html.match(/<script id="portfolio-projects" type="application\/json">(.*?)<\/script>/s)![1])
 assert.ok(dto.projects.length>0);assert.equal(dto.version,1)
 const asset=html.match(/src="([^" ]+\.js)"/)!
 assert.ok(asset)
 const script=await fetch(origin+asset[1]);assert.equal(script.status,200)
 assert.equal(script.headers.get('access-control-allow-origin'),'*')
 const head=await fetch(origin+asset[1],{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'')
 const base=match[1].split('/projects/')[0]
 assert.equal((await fetch(origin+base+'/preview-manifest.json')).status,404)
 assert.equal((await fetch(origin+base+'/cms.db')).status,404)
 assert.equal((await fetch(origin+base+'/assets/missing.png')).status,404)
 assert.equal((await fetch(origin+'/api/preview-artifacts/'+'0'.repeat(64)+'/projects/corvo')).status,404)
 const repeated=await fetch(origin+`/preview/projects/${id}?mode=draft`,{headers})
 assert.ok((await repeated.text()).includes(match[1]))
}
const auth={...headers,Origin:origin,'Content-Type':'application/json'}
const baseline=await(await fetch(origin+'/api/projects/2?draft=false',{headers})).json()
const publicBefore=await(await fetch(origin+'/api/site-content')).json()
try{
 const saved=await fetch(origin+'/api/projects/2?draft=true',{method:'PATCH',headers:auth,body:JSON.stringify({title:'Private no-build preview',_status:'draft'})});assert.equal(saved.status,200)
 const html=await(await fetch(origin+'/preview/projects/2?mode=draft',{headers})).text(),match=html.match(/src="(\/api\/preview-artifacts\/[a-f0-9]{64}\/projects\/[^"<]+)"/)!
 const frame=await(await fetch(origin+match[1])).text()
 const dto=JSON.parse(frame.match(/<script id="portfolio-projects" type="application\/json">(.*?)<\/script>/s)![1])
 assert.equal(dto.projects.find((project:{slug:string})=>project.slug===baseline.slug).title,'Private no-build preview')
 assert.deepEqual(await(await fetch(origin+'/api/site-content')).json(),publicBefore)
 const invalid=structuredClone(baseline.releaseContent);invalid.redesign.card.preview.back.src='/assets/projects/'+baseline.slug+'/uploads/'+'e'.repeat(64)+'.png'
 const failedDraft=await fetch(origin+'/api/projects/2?draft=true',{method:'PATCH',headers:auth,body:JSON.stringify({slug:'private-invalid-preview',releaseContent:invalid,_status:'draft'})});assert.equal(failedDraft.status,200)
 const fallback=await(await fetch(origin+'/preview/projects/2?mode=draft',{headers})).text()
 assert.ok(fallback.includes('Ниже остаётся предыдущий успешный предпросмотр.'))
 assert.ok(fallback.includes(match[1]))
 assert.deepEqual(await(await fetch(origin+'/api/site-content')).json(),publicBefore)
}finally{
 const restored=await fetch(origin+'/api/projects/2',{method:'PATCH',headers:auth,body:JSON.stringify({title:baseline.title,releaseContent:baseline.releaseContent,releaseAssets:baseline.releaseAssets,_status:'published'})});assert.equal(restored.status,200)
}
assert.equal(await readFile('.next/BUILD_ID','utf8'),build)
assert.equal(createHash('sha256').update(await readFile('../../.portfolio-release/preview/preview-manifest.json')).digest('hex'),digest)
console.log('PASS: no-build saved-draft runtime JSON;  authenticated preview creation, both template scoped frames, credential-free capability reads, sandbox/CORS/no-store, HEAD, namespace and manifest exclusion, cache reuse')
