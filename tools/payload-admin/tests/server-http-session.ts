import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
async function request(url:string,options:RequestInit={}){
 return new Promise<Response>((resolve,reject)=>{
  const req=http.request(url,{method:options.method||'GET',headers:Object.fromEntries(new Headers(options.headers))},response=>{
   const chunks:Buffer[]=[]
   response.on('data',chunk=>chunks.push(chunk));response.on('error',reject);response.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:response.statusCode,headers:new Headers(Object.fromEntries(Object.entries(response.headers).filter(([,value])=>value!==undefined).map(([key,value])=>[key,Array.isArray(value)?value.join(', '):String(value)])))})))
  });req.on('error',reject);req.end(options.body||undefined)
 })
}
const data=path.resolve(await readFile('/private/tmp/payload-online-server-root.txt','utf8'))
assert.equal(path.dirname(path.dirname(data)),path.resolve(os.tmpdir()));assert.ok(path.basename(path.dirname(data)).startsWith('des-art-payload-test-online-server-'))
const host='http://127.0.0.1:41742',origin='https://art-des.ru',headers={Host:'art-des.ru',Origin:origin,'X-Forwarded-Proto':'https','Content-Type':'application/json'}
assert.equal((await request(host+'/api/users/first-register',{method:'POST',headers,body:'{}'})).status,403)
const response=await request(host+'/api/users/login',{method:'POST',headers,body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})});assert.equal(response.status,200)
const cookie=response.headers.get('set-cookie')!;assert.match(cookie,/Secure/i);assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Lax/i)
const auth={...headers,Cookie:cookie.split(';')[0]},before=await(await request(host+'/api/site-content')).json()
const raw=await request(host+'/api/projects/2?draft=false',{headers:auth});assert.equal(raw.status,200)
const baseline=await raw.json()
try{
 const denied=await request(host+'/api/projects/2',{method:'PATCH',headers:{...auth,Origin:'https://evil.example'},body:JSON.stringify({title:'Do not apply'})});assert.equal(denied.status,403)
 assert.equal((await request(host+'/api/projects',{headers:{...auth,Origin:'https://evil.example'}})).status,403)
 assert.equal((await request(host+'/api/projects')).status,403)
 const draft=await request(host+'/api/projects/2?draft=true',{method:'PATCH',headers:auth,body:JSON.stringify({title:'Private server draft',_status:'draft'})});assert.equal(draft.status,200)
 assert.deepEqual(await(await request(host+'/api/site-content')).json(),before)
 const applied=await request(host+'/api/projects/2',{method:'PATCH',headers:auth,body:JSON.stringify({title:'Online server mode applied',_status:'published'})});assert.equal(applied.status,200)
 assert.ok((await(await request(host+'/projects/'+baseline.slug)).text()).includes('Online server mode applied'))
 const preview=await request(host+'/preview/projects/2?mode=draft',{headers:{Host:'art-des.ru',Cookie:auth.Cookie,'Sec-Fetch-Site':'none'}});assert.equal(preview.status,200);assert.ok((await preview.text()).includes('sandbox="allow-scripts"'))
}finally{const restored=await request(host+'/api/projects/2',{method:'PATCH',headers:auth,body:JSON.stringify({title:baseline.title,releaseContent:baseline.releaseContent,releaseAssets:baseline.releaseAssets,_status:'published'})});assert.equal(restored.status,200)}
console.log('PASS: real online-mode runtime: Secure/HttpOnly/SameSite cookie login, native cookie auth, cross-origin/anonymous denial, blocked first-register, native draft/Publish/private preview with external persistent data; fixture restored')
