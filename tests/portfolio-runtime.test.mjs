import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createPortfolioServer} from '../tools/portfolio-runtime/server.mjs';
import {createDeliveryGeneration,DELIVERY_CAPABILITIES} from '../tools/portfolio-delivery/contract.mjs';
import {projectImageSource} from '../src/lib/project-image-source.mjs';
import {runtimeProjectDocuments} from '../tools/concept-v2/app/src/project-page/runtime-documents.mjs';
import {fixture,layoutFixture} from './fixtures/portfolio-delivery.mjs';
const renderer={rendererId:'a'.repeat(64),contractVersion:'public-delivery-v1',capabilities:DELIVERY_CAPABILITIES};
async function activate(root,source,seq){
 const generation=createDeliveryGeneration(source,renderer),dir=path.join(root,'generations',generation.contentId);await mkdir(dir,{recursive:true});
 for(const asset of source.assets){const file=path.join(dir,asset.publicPath.slice(1));await mkdir(path.dirname(file),{recursive:true});await writeFile(file,asset.bytes);}
 await writeFile(path.join(dir,'generation.json'),JSON.stringify(generation));
 const descriptor={contractVersion:generation.contractVersion,contentId:generation.contentId,rendererId:renderer.rendererId,activationSeq:seq};
 await mkdir(path.join(root,'activated'),{recursive:true});await writeFile(path.join(root,'activated',generation.contentId+'.json'),JSON.stringify(descriptor));
 await writeFile(path.join(root,'active.json'),JSON.stringify(descriptor));
 return generation;
}
async function setup(){
 const root=await mkdtemp('/private/tmp/portfolio-runtime-'),siteRoot=path.join(root,'site'),contentRoot=path.join(root,'content');await mkdir(siteRoot);await mkdir(contentRoot);
 const html=Buffer.from('<html lang="ru"><head><title>Fixture</title></head><body><div id="root"></div></body></html>');await writeFile(path.join(siteRoot,'index.html'),html);
 await writeFile(path.join(siteRoot,'site-manifest.json'),JSON.stringify({version:1,buildSha:'b'.repeat(40),pages:{'/':{title:'Portfolio',description:'Fixture'}},contentAssets:[],files:[{path:'index.html',bytes:html.length,sha256:createHash('sha256').update(html).digest('hex')}]}));
 const server=createPortfolioServer({siteRoot,contentRoot,renderer});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 return {root,siteRoot,contentRoot,url,server,cleanup:async()=>{await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}};
}
test('standalone public process serves complete generations, scoped assets, metadata and empty state',async()=>{
 const env=await setup();
 try{
  const source=fixture(),a=await activate(env.contentRoot,source,1);
  let response=await fetch(env.url+'/');assert.equal(response.status,200);assert.equal((await response.text()).includes('/__content/'+a.contentId),true);
  assert.equal((await fetch(env.url+'/projects/fixture-one')).status,200);
  assert.equal((await fetch(env.url+'/projects',{redirect:'manual'})).status,307); // manual redirect below
  response=await fetch(env.url+'/404');assert.equal(response.status,404);assert.equal(response.headers.get('x-robots-tag'),'noindex');
  assert.equal((await fetch(env.url+'/preview/private')).status,404);
  const asset=source.assets[0],scoped='/__content/'+a.contentId+asset.publicPath;
  response=await fetch(env.url+scoped);assert.deepEqual(Buffer.from(await response.arrayBuffer()),asset.bytes);assert.match(response.headers.get('cache-control'),/immutable/);
  response=await fetch(env.url+scoped,{method:'HEAD'});assert.equal(await response.text(),'');assert.equal(response.headers.get('content-length'),String(asset.bytes.length));
  assert.equal((await fetch(env.url+scoped,{headers:{'if-none-match':'"'+asset.sha256+'"'}})).status,304);
  assert.equal((await fetch(env.url+'/api/site-content')).status,200);
  const b=fixture();b.projects[0].title='Code stayed unchanged';await activate(env.contentRoot,b,2);
  assert.equal((await (await fetch(env.url+'/api/site-content')).json()).projects[0].title,'Code stayed unchanged');
  assert.equal((await fetch(env.url+scoped)).status,200);
  await activate(env.contentRoot,{projects:[],assets:[],externalDependencies:[]},3);
  assert.equal((await fetch(env.url+'/')).status,200);assert.equal((await fetch(env.url+'/projects/fixture-one')).status,404);
  assert.equal((await (await fetch(env.url+'/api/site-content')).json()).projects.length,0);
  assert.equal((await (await fetch(env.url+'/sitemap.xml')).text()).includes('fixture-one'),false);
  assert.equal((await fetch(env.url+scoped)).status,200);
 }finally{await env.cleanup();}
});
test('candidate readiness does not expose unactivated content and missing initial store returns 503',async()=>{
 const env=await setup();
 try{
  assert.equal((await fetch(env.url+'/')).status,503);
  const source=layoutFixture(),a=await activate(env.contentRoot,source,1);
  const unpublished=fixture();unpublished.projects[0].title='Private pending';const b=await activate(env.contentRoot,unpublished,2);
  await rm(path.join(env.contentRoot,'activated',b.contentId+'.json'));
  await writeFile(path.join(env.contentRoot,'active.json'),JSON.stringify({contractVersion:a.contractVersion,contentId:a.contentId,rendererId:renderer.rendererId,activationSeq:1}));
  assert.equal((await fetch(env.url+'/__content/'+b.contentId+unpublished.assets[0].publicPath)).status,404);
  const response=await fetch(env.url+'/__internal/candidate?contentId='+b.contentId);assert.equal(response.status,200);assert.equal((await response.json()).contentId,b.contentId);
  const base=a.projects[0].redesign.hero.scenes[0].source.assetBase;
  assert.equal((await fetch(env.url+base+'app.js')).status,200);
  assert.equal((await fetch(env.url+'/assets/projects/fixture-one/private.png')).status,404);
  assert.equal((await fetch(env.url+'/api/projects',{method:'POST'})).status,405);
 }finally{await env.cleanup();}
});

test('release/preview require injected content and browser rendition resolver preserves scoped URLs',()=>{
 assert.throws(()=>runtimeProjectDocuments(['Git fallback'],null,{required:true}),/required/);
 assert.deepEqual(runtimeProjectDocuments(['Git fallback'],{textContent:JSON.stringify({version:1,revision:'c'.repeat(64),projects:[]})},{required:true}),[]);
 for(const prefix of ['/__content/','/api/preview-artifacts/']){
  const src=prefix+'d'.repeat(64)+'/assets/projects/corvo/redesign/imgDesktop3.png';
  const image=projectImageSource({src});assert.equal(image.fallback,src);assert.equal(image.sources[0].srcSet.includes(prefix+'d'.repeat(64)),true);
 }
});

test('public HTTP uses verified actual raster MIME even when original extension differs',async()=>{
 const env=await setup();
 try{
  const source=fixture(),asset=source.assets[0];asset.bytes=Buffer.from([255,216,255,224,0,16]);asset.sha256=createHash('sha256').update(asset.bytes).digest('hex');
  const gen=await activate(env.contentRoot,source,1);
  const response=await fetch(env.url+'/__content/'+gen.contentId+asset.publicPath);
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/jpeg');assert.deepEqual(Buffer.from(await response.arrayBuffer()),asset.bytes);
 }finally{await env.cleanup();}
});
