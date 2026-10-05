import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {compilePreview,scopeValue} from '../scripts/preview/compiler.mjs'
import {exportApprovedRedesign} from '../../concept-v2/export-approved-content.mjs'
const repoRoot=path.resolve(import.meta.dirname,'../../..')
const base='/api/preview-artifacts/'+ 'a'.repeat(64)+'/'
test('private path mapping preserves external links and geometry',()=>{
 const source={src:'/assets/project.png',href:'https://example.test',anchor:'#x',width:4096,hero:{adaptives:['desktop']}}
 assert.deepEqual(scopeValue(source,base),{...source,src:base+'assets/project.png'})
 assert.equal(source.src,'/assets/project.png')
})
test('same renderer compiles approved templates into a private scoped artifact',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-preview-compile-'))
 try{
  const prepared=await exportApprovedRedesign({repoRoot})
  const input=path.join(root,'input.json'),output=path.join(root,'site')
  await writeFile(input,JSON.stringify({version:1,revision:'fixture',source:{mode:'draft'},projects:prepared.projects,assets:prepared.assets.map(asset=>({...asset,bytes:undefined,base64:asset.bytes.toString('base64')}))}))
  const manifest=await compilePreview({inputFile:input,output,base})
  assert.ok(manifest.files.length>100)
  assert.equal(manifest.source.mode,'draft')
  const html=await readFile(path.join(output,'index.html'),'utf8')
  assert.ok(html.includes(base+'assets/'))
  const js=manifest.files.find(file=>/^assets\/index.*\.js$/.test(file.path))!
  const bundle=await readFile(path.join(output,js.path),'utf8')
  assert.ok(bundle.includes(base+'figma/'))
  assert.ok(bundle.includes(base+'assets/projects/'))
  for(const asset of prepared.assets)assert.deepEqual(await readFile(path.join(output,asset.publicPath.slice(1))),asset.bytes)
  await assert.rejects(compilePreview({inputFile:input,output,base:'/api/../'}),/namespace/)
 }finally{await rm(root,{recursive:true,force:true})}
})
