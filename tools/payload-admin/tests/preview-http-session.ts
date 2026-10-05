import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const origin='http://127.0.0.1:41741'
assert.equal((await fetch(origin+'/preview/projects/1',{redirect:'manual'})).status,307)
const login=await fetch(origin+'/api/users/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})})
assert.equal(login.status,200)
const {token}=await login.json() as {token:string}
const headers={Authorization:`JWT ${token}`}
for(const id of [1,2]) {
 const response=await fetch(origin+`/preview/projects/${id}?mode=draft`,{headers})
 assert.equal(response.status,200)
 const page=await response.text()
 assert.equal(page.includes('Не удалось собрать'),false)
 assert.ok(page.includes('sandbox="allow-scripts"'))
 const match=page.match(/src="(\/api\/preview-artifacts\/[a-f0-9]{64}\/projects\/[^"<]+)"/)
 assert.ok(match,'Private frame missing')
 const frame=await fetch(origin+match[1]) // Deliberately no CMS credentials in sandbox transport.
 assert.equal(frame.status,200)
 assert.ok(frame.headers.get('content-security-policy')?.includes('sandbox allow-scripts'))
 assert.equal(frame.headers.get('access-control-allow-origin'),'*')
 assert.ok(frame.headers.get('cache-control')?.includes('no-store'))
 const html=await frame.text(),asset=html.match(/src="([^" ]+\.js)"/)!
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
console.log('PASS: authenticated preview creation, both template scoped frames, credential-free capability reads, sandbox/CORS/no-store, HEAD, namespace and manifest exclusion, cache reuse')
