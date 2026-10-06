import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {createDeliveryGeneration,DELIVERY_CAPABILITIES} from '../../portfolio-delivery/contract.mjs'
import {layoutFixture} from '../../../tests/fixtures/portfolio-delivery.mjs'
import {createPreviewArtifact,previewArtifactResponse} from '../src/preview-artifacts'
const placeholder='/api/preview-artifacts/'+'0'.repeat(64)+'/'
test('private preview uses a prebuilt renderer and exact saved-draft bytes without compilation',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-preview-runtime-'))
 try{
  const files=[]
  for(const [name,value] of [['index.html','<html><head><script src="'+placeholder+'assets/app.js"></script></head></html>'],['assets/app.js','const base="'+placeholder+'";']]){
   await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),value);files.push({path:name,size:Buffer.byteLength(value),sha256:createHash('sha256').update(value).digest('hex')})
  }
  await writeFile(path.join(root,'preview-manifest.json'),JSON.stringify({version:1,rendererId:'a'.repeat(64),base:placeholder,revision:'compiled',files,contentAssets:[],packageFiles:{}}))
  const fixture=layoutFixture(),generation=createDeliveryGeneration(fixture,{rendererId:'a'.repeat(64),contractVersion:'public-delivery-v1',capabilities:DELIVERY_CAPABILITIES}),project=generation.projects[0]
  assert.equal(project.redesign?.hero.kind,'layout');if(project.redesign?.hero.kind!=='layout')throw new Error('Fixture layout expected')
  const scene=project.redesign.hero.scenes[0]
  assert.equal(scene.source.kind,'package');if(scene.source.kind!=='package')throw new Error('Fixture package expected')
  project.title='Private </script>'
  assert.equal(project.redesign.page.templateId,'sarafan-redesign-v1');if(project.redesign.page.templateId!=='sarafan-redesign-v1')throw new Error('Fixture page expected')
  project.redesign.page.flow.action.href='/projects/fixture-two#details'
  const publicPath=scene.source.assetBase+'index.html',bytes=fixture.assets.find(asset=>asset.publicPath===publicPath)!.bytes
  const prepared={version:1 as const,revision:'a'.repeat(64),rendererId:'a'.repeat(64),previewRoot:root,source:{projectId:1,slug:project.slug,mode:'draft' as const,authorStatus:'draft' as const,updatedAt:'fixture'},...fixture,projects:generation.projects}
  const artifact=await createPreviewArtifact({prepared:prepared as never,dataRoot:root,owner:1}),key=artifact.base.split('/')[3]
  const html=await(await previewArtifactResponse(key,['projects',project.slug])).text()
  assert.ok(html.includes(artifact.base+'assets/app.js'))
  const json=html.match(/<script id="portfolio-projects" type="application\/json">(.*?)<\/script>/s)![1];assert.ok(!json.includes('<'));assert.equal(JSON.parse(json).projects[0].title,'Private </script>')
  assert.ok(JSON.parse(json).projects[0].redesign.hero.scenes[0].source.assetBase.startsWith(artifact.base))
  assert.equal(JSON.parse(json).projects[0].redesign.page.flow.action.href,artifact.base+'projects/fixture-two#details')
  assert.ok((await(await previewArtifactResponse(key,['assets','app.js'])).text()).includes(artifact.base))
  const resource=await previewArtifactResponse(key,publicPath.slice(1).split('/'));assert.deepEqual(Buffer.from(await resource.arrayBuffer()),bytes);assert.match(resource.headers.get('content-security-policy')!,/sandbox allow-scripts/)
  for(const segments of [['snapshot.json'],['..'],['projects','absent']])assert.equal((await previewArtifactResponse(key,segments)).status,404)
  assert.equal((await previewArtifactResponse('f'.repeat(64),[])).status,404)
 }finally{await rm(root,{recursive:true,force:true})}
})
