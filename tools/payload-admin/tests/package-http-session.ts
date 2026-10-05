import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {bindPackage,type PackageMaterial} from '../src/authoring/packages'
import type {Value} from '../src/authoring/model'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const origin='http://127.0.0.1:41741'
const login=await fetch(`${origin}/api/users/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})})
assert.equal(login.status,200)
const {token}=await login.json() as {token:string}
const auth={Authorization:`JWT ${token}`}
type Record={releaseContent:Value;releaseAssets:{publicPath:string}[]}
async function project(draft:boolean):Promise<Record>{const response=await fetch(`${origin}/api/projects/1?draft=${draft}&depth=0`,{headers:auth});assert.equal(response.status,200);return response.json()}
async function counts(){return Promise.all(['media','project-files'].map(async name=>{const response=await fetch(`${origin}/api/${name}?limit=1`,{headers:auth});assert.equal(response.status,200);return (await response.json() as {totalDocs:number}).totalDocs}))}
const baseline=await project(false)
const image=await sharp({create:{width:8,height:8,channels:4,background:'#987654'}}).jpeg().toBuffer()
const inputs=[{path:'scene/index.html',bytes:Buffer.from('<link href="main.css"><img src="screen.png"><script type="module" src="app.js"></script>')},{path:'scene/main.css',bytes:Buffer.from('body{background:#fff}')},{path:'scene/app.js',bytes:Buffer.from('document.querySelector("img").addEventListener("click",()=>document.body.classList.toggle("selected"));')},{path:'scene/screen.png',bytes:image}]
function form(bad=false){const data=new FormData();data.set('projectId','1');data.set('entry','scene/index.html');for(const input of inputs){data.append('path',bad?'../unsafe.html':input.path);data.append('file',new File([new Uint8Array(input.bytes)],path.basename(input.path)))}return data}
assert.equal((await fetch(`${origin}/api/materials/layout`,{method:'POST',body:form(),headers:{Origin:origin}})).status,401)
assert.equal((await fetch(`${origin}/api/materials/layout`,{method:'POST',body:form(),headers:{...auth,Origin:'https://foreign.example'}})).status,403)
const before=await counts()
const invalid=await fetch(`${origin}/api/materials/layout`,{method:'POST',body:form(true),headers:{...auth,Origin:origin}})
assert.equal(invalid.status,400)
assert.deepEqual(await counts(),before)
const response=await fetch(`${origin}/api/materials/layout`,{method:'POST',body:form(),headers:{...auth,Origin:origin}})
assert.equal(response.status,200,await response.clone().text())
const {material}=await response.json() as {material:PackageMaterial}
assert.equal(material.source.files.length,4)
assert.equal(material.source.files.find(file=>file.path==='scene/screen.png')!.mime,'image/jpeg')
const bound=bindPackage(baseline.releaseContent,['redesign','hero','scenes',0,'source'],material)
const saved=await fetch(`${origin}/api/projects/1?draft=true`,{method:'PATCH',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({releaseContent:bound,_status:'draft'})})
assert.equal(saved.status,200,await saved.text())
const reopened=await project(true)
assert.deepEqual(reopened.releaseContent,bound)
assert.ok(material.bindings.every(binding=>reopened.releaseAssets.some(asset=>asset.publicPath===binding.publicPath)))
assert.deepEqual((await project(false)).releaseContent,baseline.releaseContent)
for(const binding of material.bindings){const deletion=await fetch(`${origin}/api/${binding.file.relationTo}/${binding.file.value}`,{method:'DELETE',headers:auth});assert.equal(deletion.status,409)}
await writeFile(path.join(root,'package-http-proof.json'),JSON.stringify({material,baseline,inputs:inputs.map(file=>({path:file.path,bytes:file.bytes.toString('base64')}))}))
console.log('PASS: package auth/origin checks, invalid package writes no files, HTML/CSS/JS/PNG upload and draft reopen, automatic bindings, published isolation and version deletion guards')
