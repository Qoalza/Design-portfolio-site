import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {randomUUID} from 'node:crypto'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const origin='http://127.0.0.1:41741'
for(const route of ['status','prepare','cancel'])assert.equal((await fetch(origin+'/api/site-publication/'+route,{method:route==='status'?'GET':'POST'})).status,401)
const login=await fetch(origin+'/api/users/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})});assert.equal(login.status,200)
const {token}=await login.json() as {token:string},auth={Authorization:`JWT ${token}`}
async function post(route:string,body:unknown,foreign=false){return fetch(origin+'/api/site-publication/'+route,{method:'POST',headers:{...auth,Origin:foreign?'https://foreign.example':origin,'Content-Type':'application/json'},body:JSON.stringify(body)})}
assert.equal((await post('prepare',{requestId:randomUUID()},true)).status,403)
assert.equal((await post('prepare',{requestId:'invalid'})).status,400)
assert.equal((await fetch(origin+'/api/site-publication/prepare',{method:'POST',headers:{...auth,Origin:origin,'Content-Type':'application/json'},body:' '.repeat(4097)})).status,413)
if(process.argv.includes('--prepare')){
 const requestId=randomUUID(),response=await post('prepare',{requestId});assert.equal(response.status,202)
 const {operation:started}=await response.json() as {operation:{id:string;state:string}}
 assert.equal(started.state,'preparing')
 assert.equal((await (await post('prepare',{requestId})).json()).operation.id,started.id)
 const deadline=Date.now()+600000
 for(;;){
  const response=await fetch(origin+'/api/site-publication/status?id='+started.id,{headers:auth,signal:AbortSignal.timeout(5000)});assert.equal(response.status,200)
  const {operation}=await response.json() as {operation:{state:string;codeSha:string;contentHash:string;artifactHash?:string}}
  if(operation.state==='ready'){assert.ok(operation.artifactHash);await writeFile('/private/tmp/payload-publication-ready-operation.json',JSON.stringify({root,id:started.id,codeSha:operation.codeSha,contentHash:operation.contentHash}));break}
  assert.equal(operation.state,'preparing');assert.ok(Date.now()<deadline,'preparation timed out')
  await new Promise(resolve=>setTimeout(resolve,1000))
 }
 console.log('PASS: authenticated prepare launched one detached builder and reached a durable exact ready archive')
}
const pointer=JSON.parse(await readFile('/private/tmp/payload-publication-ready-operation.json','utf8')) as {id:string}
const status=await fetch(origin+'/api/site-publication/status?id='+pointer.id,{headers:auth});assert.equal(status.status,200);assert.ok(status.headers.get('cache-control')?.includes('no-store'))
const {operation}=await status.json() as {operation:{state:string;requestId:string;id:string}}
assert.equal(operation.state,'ready')
// Replay observes the frozen job even while code/content are being edited.
const replay=await post('prepare',{requestId:operation.requestId});assert.equal(replay.status,202);assert.equal((await replay.json()).operation.id,operation.id)
assert.equal((await fetch(origin+'/api/site-publication/status?id=../secret',{headers:auth})).status,404)
if(process.argv.includes('--cancel')){const canceled=await post('cancel',{id:operation.id});assert.equal(canceled.status,200);assert.equal((await canceled.json()).operation.errorCode,'CANCELED');assert.equal((await post('cancel',{id:operation.id})).status,409)}
console.log('PASS: native publication auth/CSRF/JSON limits, durable frozen replay/status/no-store, path denial and optional ready-only cancellation')
