import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {createPreviewArtifact,previewArtifactResponse} from '../src/preview-artifacts'
const placeholder='/api/preview-artifacts/'+'0'.repeat(64)+'/'
test('private preview uses a prebuilt renderer and exact saved-draft bytes without compilation',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-preview-runtime-'))
 const previous=process.env.PORTFOLIO_PREVIEW_ROOT;process.env.PORTFOLIO_PREVIEW_ROOT=root
 try{
  const files=[]
  for(const [name,value] of [['index.html','<html><head><script src="'+placeholder+'assets/app.js"></script></head></html>'],['assets/app.js','const base="'+placeholder+'";']]){
   await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),value);files.push({path:name,size:Buffer.byteLength(value),sha256:createHash('sha256').update(value).digest('hex')})
  }
  await writeFile(path.join(root,'preview-manifest.json'),JSON.stringify({version:1,base:placeholder,revision:'compiled',files,contentAssets:[],packageFiles:{}}))
  const bytes=Buffer.from('<html>unchanged package</html>')
  const prepared={version:1 as const,revision:'a'.repeat(64),source:{projectId:1,slug:'corvo',mode:'draft' as const,authorStatus:'draft' as const,updatedAt:'fixture'},projects:[{slug:'corvo',title:'Private </script>',redesign:{hero:{kind:'layout',scenes:[{source:{kind:'package',assetBase:'/assets/projects/corvo/hero-layout/',files:[{path:'index.html',mime:'text/html'}]}}]}}}],assets:[{publicPath:'/assets/projects/corvo/hero-layout/index.html',sha256:createHash('sha256').update(bytes).digest('hex'),bytes}],externalDependencies:[]}
  const artifact=await createPreviewArtifact({prepared:prepared as never,dataRoot:root,owner:1}),key=artifact.base.split('/')[3]
  const html=await(await previewArtifactResponse(key,['projects','corvo'])).text()
  assert.ok(html.includes(artifact.base+'assets/app.js'))
  const json=html.match(/<script id="portfolio-projects" type="application\/json">(.*?)<\/script>/s)![1];assert.ok(!json.includes('<'));assert.equal(JSON.parse(json).projects[0].title,'Private </script>')
  assert.ok(JSON.parse(json).projects[0].redesign.hero.scenes[0].source.assetBase.startsWith(artifact.base))
  assert.ok((await(await previewArtifactResponse(key,['assets','app.js'])).text()).includes(artifact.base))
  const resource=await previewArtifactResponse(key,['assets','projects','corvo','hero-layout','index.html']);assert.deepEqual(Buffer.from(await resource.arrayBuffer()),bytes);assert.match(resource.headers.get('content-security-policy')!,/sandbox allow-scripts/)
  for(const segments of [['snapshot.json'],['..'],['projects','absent']])assert.equal((await previewArtifactResponse(key,segments)).status,404)
  assert.equal((await previewArtifactResponse('f'.repeat(64),[])).status,404)
 }finally{if(previous===undefined)delete process.env.PORTFOLIO_PREVIEW_ROOT;else process.env.PORTFOLIO_PREVIEW_ROOT=previous;await rm(root,{recursive:true,force:true})}
})
