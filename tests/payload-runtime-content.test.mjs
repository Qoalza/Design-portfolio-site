import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
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
