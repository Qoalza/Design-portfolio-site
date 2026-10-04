import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';import path from 'node:path';
import {createReleaseHandler} from '../tools/portfolio-release/release-host.mjs';
const sha='a'.repeat(40);
test('actual release boundary: pages, temporary redirect, new 404, assets, HEAD and isolated packages',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'redesign-host-'));
 try{
  const sources={'index.html':'<!doctype html><html lang="ru"><head><title>placeholder</title></head><body><div id="root"></div></body></html>','assets/app.js':'export {};','assets/projects/corvo/layout/index.html':'<!doctype html><title>Scene</title>'};
  const files=[];for(const [name,bytes] of Object.entries(sources)){await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),bytes);files.push({path:name,bytes:Buffer.byteLength(bytes),sha256:createHash('sha256').update(bytes).digest('hex')});}
  const manifest={version:1,buildSha:sha,pages:{'/':{title:'Артур — Product Designer',description:'Portfolio'},'/projects/corvo':{title:'Corvo — Product Designer',description:'Corvo'},'/projects/sarafan-radio':{title:'Сараффан.Радио — Product Designer',description:'Radio'}},files,packageFiles:{'/assets/projects/corvo/layout/index.html':'text/html'}};
  await writeFile(path.join(root,'site-manifest.json'),JSON.stringify(manifest));const serve=createReleaseHandler({root});const request=(url,method='GET')=>serve(new Request('https://art-des.ru'+url,{method}));
  for(const route of Object.keys(manifest.pages)){const response=await request(route);assert.equal(response.status,200);const html=await response.text();assert.match(html,/data-build-sha="a{40}"/);assert.ok(html.includes(manifest.pages[route].title));assert.match(html,new RegExp('rel="canonical" href="https://art-des.ru'+route+'"'));assert.doesNotMatch(html,/noindex|Concept V/);}
  const redirect=await request('/projects');assert.equal(redirect.status,307);assert.equal(redirect.headers.get('location'),'/#projects');
  for(const url of ['/404','/unknown','/projects/old','/concept-v2','/navigation-lab','/preloader','/admin','/preview/project-responsive-hero']){const response=await request(url);assert.equal(response.status,404);assert.match(await response.text(),/<title>Страница не найдена/);}
  assert.equal((await request('/projects/corvo','HEAD')).status,200);assert.equal(await (await request('/projects/corvo','HEAD')).text(),'');assert.equal((await request('/unknown','HEAD')).status,404);
  assert.equal((await request('/','POST')).status,405);
  const scene=await request('/assets/projects/corvo/layout/index.html');assert.equal(scene.status,200);assert.match(scene.headers.get('content-security-policy'),/sandbox allow-scripts/);assert.doesNotMatch(scene.headers.get('content-security-policy'),/allow-same-origin/);assert.equal(scene.headers.get('access-control-allow-origin'),'*');
  assert.equal((await request('/assets/app.js')).headers.get('content-type'),'text/javascript; charset=utf-8');
  assert.equal((await request('/assets/missing.js')).status,404);assert.equal((await request('/site-manifest.json')).status,404);
  const robots=await (await request('/robots.txt')).text();assert.match(robots,/Allow: \/\n/);assert.doesNotMatch(robots,/Disallow: \/\n/);
  const sitemap=await (await request('/sitemap.xml')).text();assert.match(sitemap,/projects\/corvo/);assert.doesNotMatch(sitemap,/<loc>[^<]*\/404<\/loc>|\/preview/);
  // A changed immutable runtime file must not be accepted on the next startup.
  await writeFile(path.join(root,'assets/app.js'),'damaged');await assert.rejects(createReleaseHandler({root})(new Request('https://art-des.ru/')),/checksum|manifest/i);
 }finally{await rm(root,{recursive:true,force:true});}
});
