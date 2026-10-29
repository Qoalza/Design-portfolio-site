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
  const sources={'index.html':'<!doctype html><html lang="ru" data-early-loading><head><meta charset="UTF-8"/><title>placeholder</title><style>'+'/*large critical CSS*/'.repeat(8000)+'</style></head><body><div id="root"></div></body></html>','assets/app.js':'export {};','assets/projects/corvo/layout/index.html':'<!doctype html><title>Scene</title>'};
  const files=[];for(const [name,bytes] of Object.entries(sources)){await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),bytes);files.push({path:name,bytes:Buffer.byteLength(bytes),sha256:createHash('sha256').update(bytes).digest('hex')});}
  const manifest={version:1,buildSha:sha,snapshotSha256:'b'.repeat(64),pages:{'/':{title:'Артур — Product Designer',description:'Portfolio'},'/projects/corvo':{title:'Corvo — Product Designer',description:'Corvo'},'/projects/sarafan-radio':{title:'Сараффан.Радио — Product Designer',description:'Radio'}},files,packageFiles:{'/assets/projects/corvo/layout/index.html':'text/html'}};
  await writeFile(path.join(root,'site-manifest.json'),JSON.stringify(manifest));const serve=createReleaseHandler({root});const request=(url,method='GET')=>serve(new Request('https://art-des.ru'+url,{method}));
  for(const route of Object.keys(manifest.pages)){const response=await request(route);assert.equal(response.status,200);const html=await response.text();assert.match(html,/<html lang="ru" data-early-loading data-build-sha="a{40}"/);assert.match(html,/data-content-sha256="b{64}"/);assert.ok(html.includes(manifest.pages[route].title));assert.match(html,new RegExp('rel="canonical" href="https://art-des.ru'+route+'"'));assert.doesNotMatch(html,/noindex|Concept V/);assert.ok(Buffer.byteLength(html.slice(0,html.indexOf('property="og:image"')))<4096,'Share metadata must precede large critical styles');assert.ok(html.indexOf('charset="UTF-8"')<html.indexOf('property="og:image"'));const images=[...html.matchAll(/<meta property="og:image" content="([^"]+)"\/><meta property="og:image:type" content="image\/png"\/><meta property="og:image:width" content="(\d+)"\/><meta property="og:image:height" content="(\d+)"\/><meta property="og:image:alt" content="([^"]+)"\/>/g)].map(m=>m.slice(1,4));assert.deepEqual(images,[['https://art-des.ru/artur-designer-social-preview-v3.png','1200','630'],['https://art-des.ru/artur-designer-social-preview-square-v3.png','640','640']]);assert.match(html,/<meta name="twitter:image" content="https:\/\/art-des.ru\/artur-designer-social-preview-v3.png"/);}
  const redirect=await request('/projects');assert.equal(redirect.status,307);assert.equal(redirect.headers.get('location'),'/#projects');
  for(const url of ['/404','/unknown','/projects/old','/concept-v2','/navigation-lab','/preloader','/admin','/preview/project-responsive-hero']){const response=await request(url);assert.equal(response.status,404);assert.match(await response.text(),/<title>Страница не найдена/);}
  assert.equal((await request('/projects/corvo','HEAD')).status,200);assert.equal(await (await request('/projects/corvo','HEAD')).text(),'');assert.equal((await request('/unknown','HEAD')).status,404);
  assert.equal((await request('/','POST')).status,405);
  const scene=await request('/assets/projects/corvo/layout/index.html');assert.equal(scene.status,200);assert.match(scene.headers.get('content-security-policy'),/sandbox allow-scripts/);assert.doesNotMatch(scene.headers.get('content-security-policy'),/allow-same-origin/);assert.equal(scene.headers.get('access-control-allow-origin'),'*');
  assert.equal((await request('/assets/app.js')).headers.get('content-type'),'text/javascript; charset=utf-8');
  assert.equal((await request('/assets/missing.js')).status,404);assert.equal((await request('/site-manifest.json')).status,404);
  const robots=await (await request('/robots.txt')).text();assert.match(robots,/Allow: \/\n/);assert.doesNotMatch(robots,/Disallow: \/\n/);
  const sitemap=await (await request('/sitemap.xml')).text();assert.match(sitemap,/projects\/corvo/);assert.doesNotMatch(sitemap,/<loc>[^<]*\/404<\/loc>|\/preview/);
  const {verifyPublishedSite}=await import('../tools/portfolio-release/deploy-transport.mjs');
  await verifyPublishedSite({baseUrl:'https://art-des.ru/',codeSha:sha,contentHash:manifest.snapshotSha256,snapshot:{projects:[{slug:'corvo'},{slug:'sarafan-radio'}],assets:files.filter(file=>file.path.startsWith('assets/')).map(file=>({publicPath:'/'+file.path,size:file.bytes,sha256:file.sha256}))},fetchImpl:url=>serve(new Request(url))});
  delete manifest.snapshotSha256;await writeFile(path.join(root,'site-manifest.json'),JSON.stringify(manifest));
  const legacy=await createReleaseHandler({root})(new Request('https://art-des.ru/'));assert.doesNotMatch(await legacy.text(),/data-content-sha256/);
  // A changed immutable runtime file must not be accepted on the next startup.
  await writeFile(path.join(root,'assets/app.js'),'damaged');await assert.rejects(createReleaseHandler({root})(new Request('https://art-des.ru/')),/checksum|manifest/i);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('code-owned B.Off route survives live content injection without adding a DTO project',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'code-owned-boff-'));
 try{
  const html='<!doctype html><html lang="ru"><head><title>placeholder</title></head><body><div id="root"></div></body></html>';
  await writeFile(path.join(root,'index.html'),html);
  const manifest={version:1,buildSha:sha,pages:{'/':{title:'Portfolio',description:'Home'},'/projects/boff':{title:'B.Off — Product Designer',description:'B.Off approved description'},'/projects/corvo':{title:'Stale static Corvo',description:'Previously published'}},files:[{path:'index.html',bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex')}]};
  await writeFile(path.join(root,'site-manifest.json'),JSON.stringify(manifest));
  const content={version:1,revision:'c'.repeat(64),projects:[]};
  const serve=createReleaseHandler({root,readContent:async()=>content});
  const request=(url,method='GET')=>serve(new Request('https://art-des.ru'+url,{method}));
  const response=await request('/projects/boff');assert.equal(response.status,200);
  const body=await response.text();assert.match(body,/<title>B.Off — Product Designer<\/title>/);assert.match(body,/rel="canonical" href="https:\/\/art-des.ru\/projects\/boff"/);assert.match(body,/"projects":\[\]/);
  assert.equal((await request('/projects/boff','HEAD')).status,200);
  assert.match(await(await request('/sitemap.xml')).text(),/projects\/boff/);
  assert.equal((await request('/projects/boff-other')).status,404);
  assert.equal((await request('/projects/corvo')).status,404,'An unpublished content-owned page must not return from a stale static manifest');
  assert.equal(content.projects.length,0);
 }finally{await rm(root,{recursive:true,force:true});}
});
