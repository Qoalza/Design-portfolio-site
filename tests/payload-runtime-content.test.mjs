import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readdir} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {createReleaseHandler} from '../tools/portfolio-release/release-host.mjs';
import {runtimeProjectDocuments} from '../tools/concept-v2/app/src/project-page/runtime-documents.mjs';
test('already-built renderer gets changed native content, routes and metadata without build; injected JSON is inert',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'payload-runtime-content-'));
 try{
  const html='<!doctype html><html lang="ru"><head><title>Portfolio</title></head><body><div id="root"></div></body></html>';
  await writeFile(path.join(root,'index.html'),html);
  await writeFile(path.join(root,'site-manifest.json'),JSON.stringify({version:1,buildSha:'a'.repeat(40),pages:{'/':{title:'Portfolio',description:'Designer'},'/projects/old':{title:'Old',description:'Old'}},files:[{path:'index.html',bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex')}]}));
  let content={version:1,revision:'b'.repeat(64),projects:[{visibility:'published',detailAvailable:true,redesign:{},designProfile:'corvo-v1',slug:'current',title:'Current',description:'Description'}]};
  const serve=createReleaseHandler({root,readContent:async()=>content}),request=url=>serve(new Request('https://art-des.ru'+url));
  assert.equal((await request('/projects/old')).status,404);
  let response=await request('/projects/current');assert.equal(response.status,200);assert.match(await response.text(),/<title>Current — Product Designer<\/title>/);
  content={...content,revision:'c'.repeat(64),projects:[{visibility:'published',detailAvailable:true,redesign:{},designProfile:'corvo-v1',slug:'changed',title:'Updated </script><script>alert(1)</script>',description:'Changed'}]};
  response=await request('/projects/changed');assert.equal(response.status,200);
  const updated=await response.text(),json=updated.match(/<script id="portfolio-projects" type="application\/json">(.*?)<\/script>/s)[1];
  assert.ok(!json.includes('<'));
  assert.deepEqual(runtimeProjectDocuments([],{textContent:json}),content.projects);
  assert.match(updated,/data-build-sha="a{40}"/);assert.match(updated,/data-content-sha256="c{64}"/);
  assert.equal((await request('/projects/current')).status,404);
  const sitemap=await(await request('/sitemap.xml')).text();assert.ok(sitemap.includes('/projects/changed'));assert.ok(!sitemap.includes('/projects/current'));
  content={...content,projects:[{...content.projects[0],detailAvailable:false}]};
  assert.equal((await request('/projects/changed')).status,404);assert.ok(!(await(await request('/sitemap.xml')).text()).includes('/projects/changed'));
  assert.deepEqual(runtimeProjectDocuments(['static'],null),['static']);
  assert.throws(()=>runtimeProjectDocuments([],{textContent:'{}'}),/Invalid/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('online assets use published bytes only; static shell survives DB failure; HEAD/ETag/package isolation',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'payload-runtime-content-'));
 try{
  const entries=[['index.html','<html lang="ru"><head><title>Portfolio</title></head></html>'],['app.js','compiled'],['assets/projects/old.png','stale']];
  const files=[];
  for(const [name,value] of entries){const {mkdir}=await import('node:fs/promises');await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),value);files.push({path:name,bytes:Buffer.byteLength(value),sha256:createHash('sha256').update(value).digest('hex')});}
  await writeFile(path.join(root,'site-manifest.json'),JSON.stringify({version:1,buildSha:'a'.repeat(40),pages:{'/':{title:'Portfolio',description:'Designer'}},contentAssets:['/assets/projects/old.png'],files}));
  let calls=0;
  const serve=createReleaseHandler({root,readContent:async()=>{calls++;throw new Error('DB unavailable')},readAsset:async name=>name==='/assets/projects/current/frame.html'?{content:Buffer.from('<html>published</html>'),sha256:'d'.repeat(64),mime:'text/html',packaged:true}:name==='/assets/projects/current/vector.svg'?{content:Buffer.from('<svg/>'),sha256:'e'.repeat(64),mime:'image/svg+xml',packaged:true}:null});
  const request=(name,options)=>serve(new Request('https://art-des.ru'+name,options));
  assert.equal(await(await request('/app.js')).text(),'compiled');assert.equal(calls,0);
  assert.equal((await request('/assets/projects/old.png')).status,404);
  assert.equal((await request('/assets/projects/draft.png')).status,404);
  const response=await request('/assets/projects/current/frame.html');assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/sandbox/);assert.equal(response.headers.get('content-type'),'text/html');
  assert.equal((await request('/assets/projects/current/frame.html',{method:'HEAD'})).headers.get('content-length'),'22');
  assert.equal((await request('/assets/projects/current/frame.html',{headers:{'if-none-match':'"'+'d'.repeat(64)+'"'}})).status,304);
  assert.match((await request('/assets/projects/current/vector.svg')).headers.get('content-security-policy')??'',/sandbox/);
  assert.equal(calls,0);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('online host serves immutable Hero shell SVGs without CMS lookup while rejecting stale project assets',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'payload-hero-shell-'));
 try{
  const {mkdir}=await import('node:fs/promises');
  const shell='assets/projects/corvo/responsive-hero/topbar-hatch.svg';
  const stale='assets/projects/corvo/responsive-hero/unapproved.svg';
  const names=await readdir(new URL('../tools/concept-v2/app/public/assets/projects/corvo/responsive-hero/',import.meta.url));
  const codeShells=names.filter(name=>name.endsWith('.svg')).map(name=>'assets/projects/corvo/responsive-hero/'+name);
  const entries=[['index.html','<html lang="ru"><head><title>Portfolio</title></head></html>'],...codeShells.map(name=>[name,'<svg><path/></svg>']),[stale,'<svg/>']];
  const files=[];
  for(const [name,value] of entries){await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),value);files.push({path:name,bytes:Buffer.byteLength(value),sha256:createHash('sha256').update(value).digest('hex')});}
  await writeFile(path.join(root,'site-manifest.json'),JSON.stringify({version:1,buildSha:'a'.repeat(40),pages:{'/':{title:'Portfolio',description:'Designer'}},contentAssets:[],files}));
  let lookups=0;
  const serve=createReleaseHandler({root,readContent:async()=>{throw new Error('DB unavailable')},readAsset:async()=>{lookups++;return null;}});
  const response=await serve(new Request('https://art-des.ru/'+shell+'?preloader-retry=2'));
  assert.equal(response.status,200);assert.equal(await response.text(),'<svg><path/></svg>');
  assert.equal(response.headers.get('content-type'),'image/svg+xml');
  assert.match(response.headers.get('content-security-policy')??'',/sandbox/);
  assert.equal(lookups,0);
  for(const name of codeShells)assert.equal((await serve(new Request('https://art-des.ru/'+name))).status,200,name);
  assert.equal(lookups,0);
  const head=await serve(new Request('https://art-des.ru/'+shell,{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');
  assert.equal((await serve(new Request('https://art-des.ru/'+stale))).status,404);
  assert.equal((await serve(new Request('https://art-des.ru/assets/projects/corvo/draft.png'))).status,404);
  const manifest=JSON.parse(await (await import('node:fs/promises')).readFile(path.join(root,'site-manifest.json'),'utf8'));
  manifest.contentAssets=['/'+shell];await writeFile(path.join(root,'site-manifest.json'),JSON.stringify(manifest));
  const contentOwned=createReleaseHandler({root,readAsset:async()=>null});
  assert.equal((await contentOwned(new Request('https://art-des.ru/'+shell))).status,404,'content ownership must never fall back to static shell bytes');
 }finally{await rm(root,{recursive:true,force:true});}
});
