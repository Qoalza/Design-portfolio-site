import assert from 'node:assert/strict'
import {test} from 'node:test'
import sharp from 'sharp'
import {prepareLayoutPackage} from '../src/materials/layout-package'
const file=(path:string,text:string)=>({path,bytes:Buffer.from(text)})
test('layout manifest is immutable and independent of selection order, preserves original bytes and nested dependencies',async()=>{
 const image=await sharp({create:{width:4,height:4,channels:4,background:'#abcdef'}}).png().toBuffer()
 const inputs=[file('index.html','<link href="styles/main.css"><img src="images/screen.png"><script type="module" src="app.js"></script>'),file('styles/main.css','body{background:url(../images/screen.png)}'),file('app.js','import {x} from "./module.js";'),file('module.js','export const x=1;'),{path:'images/screen.png',bytes:image}]
 const a=await prepareLayoutPackage('sample','index.html',inputs)
 const b=await prepareLayoutPackage('sample','index.html',[...inputs].reverse())
 assert.deepEqual(a.source,b.source)
 assert.deepEqual(a.files.find(f=>f.path==='images/screen.png')!.bytes,image)
 const changed=await prepareLayoutPackage('sample','index.html',inputs.map(f=>f.path==='module.js'?file('module.js','export const x=2;'):f))
 assert.notEqual(changed.source.assetBase,a.source.assetBase)
})
test('unsafe paths, missing entry/dependencies, foreign scripts, wrong image and duplicate paths are rejected before persistence',async()=>{
 for(const inputs of [[file('../index.html','test')],[file('/index.html','test')],[file('index.html','<img src="missing.png">')],[file('index.html','<script src="https://evil.example/run.js"></script>')],[file('index.html','<script src="app.js"></script>'),file('app.js','import "./missing.js";')],[file('index.html','ok'),file('INDEX.html','duplicate')],[file('index.html','<img src="bad.png">'),file('bad.png','wrong image')]]) await assert.rejects(prepareLayoutPackage('sample','index.html',inputs))
 await assert.rejects(prepareLayoutPackage('sample','absent.html',[file('index.html','ok')]))
 await assert.rejects(prepareLayoutPackage('sample','index.html',[file('index.html','ok'),{path:'huge.css',bytes:Buffer.alloc(20*1024*1024+1)}]))
})
test('approved external font dependencies are declared; private/credentialed/out-of-package URLs are refused',async()=>{
 const prepared=await prepareLayoutPackage('sample','index.html',[file('index.html','<link href="https://fonts.googleapis.com/css2?family=Manrope">')])
 assert.deepEqual(prepared.externalDependencies,['https://fonts.googleapis.com/css2?family=Manrope'])
 for(const href of ['https://127.0.0.1/a','https://user:pass@fonts.googleapis.com/a','../../outside.css','javascript:alert(1)']) await assert.rejects(prepareLayoutPackage('sample','index.html',[file('index.html',`<link href="${href}">`)]))
})

test('historical bitmap extensions do not rename resources or disguise actual decoded MIME',async()=>{
 const jpeg=await sharp({create:{width:8,height:8,channels:3,background:'#abcdef'}}).jpeg().toBuffer()
 const prepared=await prepareLayoutPackage('sample','index.html',[file('index.html','<img src="avatar.png">'),{path:'avatar.png',bytes:jpeg}])
 const avatar=prepared.files.find(file=>file.path==='avatar.png')!
 assert.equal(avatar.mime,'image/jpeg')
 assert.deepEqual(avatar.bytes,jpeg)
})
