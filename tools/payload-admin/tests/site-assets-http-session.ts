import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {requiredAssets} from '../../portfolio-release/project-snapshot.mjs'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const origin='http://127.0.0.1:41741',build=await readFile('.next/BUILD_ID','utf8')
const login=await fetch(origin+'/api/users/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})});assert.equal(login.status,200)
const {token}=await login.json() as {token:string},auth={Authorization:`JWT ${token}`,Origin:origin,'Content-Type':'application/json'}
const baseline=await(await fetch(origin+'/api/projects/2?draft=false',{headers:auth})).json()
const before=await(await fetch(origin+'/api/site-content')).json()
const png=await sharp({create:{width:2,height:2,channels:4,background:'#476381'}}).png().toBuffer()
const form=new FormData();form.set('file',new Blob([new Uint8Array(png)],{type:'image/png'}),'online-http-fixture.png');form.set('_payload',JSON.stringify({alt:'Disposable online HTTP proof'}))
const upload=await fetch(origin+'/api/media',{method:'POST',headers:{Authorization:auth.Authorization,Origin:origin},body:form});assert.equal(upload.status,201)
const media=(await upload.json()).doc
assert.equal((await fetch(new URL(media.url,origin))).status,403)
const publicPath='/assets/projects/'+baseline.slug+'/uploads/'+createHash('sha256').update(png).digest('hex')+'.png'
const content=structuredClone(baseline.releaseContent)
Object.assign(content.redesign.card.preview.back,{src:publicPath,width:2,height:2})
const releaseAssets=[...baseline.releaseAssets,{publicPath,file:{relationTo:'media',value:media.id}}]
async function save(data:unknown,draft=false){return fetch(origin+'/api/projects/2'+(draft?'?draft=true':''),{method:'PATCH',headers:auth,body:JSON.stringify(data)})}
try{
 assert.equal((await save({releaseContent:content,releaseAssets,_status:'draft'},true)).status,200)
 assert.equal((await fetch(origin+publicPath)).status,404)
 assert.deepEqual(await(await fetch(origin+'/api/site-content')).json(),before)
 assert.equal((await save({releaseContent:content,releaseAssets,_status:'published'})).status,200)
 const response=await fetch(origin+publicPath);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),png)
 assert.equal((await fetch(origin+publicPath,{method:'HEAD'})).headers.get('content-length'),String(png.length))
 assert.equal((await fetch(origin+publicPath,{headers:{'if-none-match':response.headers.get('etag')!}})).status,304)
 const changed=await(await fetch(origin+'/api/site-content')).json();assert.equal(changed.projects.find((project:{slug:string})=>project.slug===baseline.slug).redesign.card.preview.back.src,publicPath)
 for(const project of changed.projects)for(const asset of requiredAssets(project).paths)assert.equal((await fetch(origin+asset,{method:'HEAD'})).status,200,String(asset))
 const invalid=structuredClone(content);invalid.redesign.card.preview.back.src='/assets/projects/'+baseline.slug+'/uploads/'+'b'.repeat(64)+'.png'
 assert.equal((await save({releaseContent:invalid,_status:'published'})).status,400)
 assert.deepEqual(await(await fetch(origin+'/api/site-content')).json(),changed)
 assert.equal(await readFile('.next/BUILD_ID','utf8'),build)
}finally{assert.equal((await save({title:baseline.title,slug:baseline.slug,releaseContent:baseline.releaseContent,releaseAssets:baseline.releaseAssets,_status:'published'})).status,200)}
assert.equal((await fetch(origin+publicPath)).status,404)
console.log('PASS: native HTTP upload → private draft → native Publish → exact public image/HEAD/ETag; full assets closure available; failed publication preserves current site; no rebuild; baseline restored')
