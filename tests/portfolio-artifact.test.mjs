import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,writeFile,readFile,rm,readdir,realpath} from 'node:fs/promises';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createDeliveryGeneration} from '../tools/portfolio-delivery/contract.mjs';
import {verifyPortfolioArtifact} from '../tools/portfolio-runtime/artifact.mjs';
import {fixture} from './fixtures/portfolio-delivery.mjs';
const sourceRoot=fileURLToPath(new URL('../.portfolio-release/portfolio',import.meta.url));
async function freePort(){const server=createServer();await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',resolve).once('error',reject));const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
async function publish(root,source,renderer,seq){
 const gen=createDeliveryGeneration(source,renderer),dir=path.join(root,'generations',gen.contentId);await mkdir(dir,{recursive:true});
 for(const asset of source.assets){const file=path.join(dir,asset.publicPath.slice(1));await mkdir(path.dirname(file),{recursive:true});await writeFile(file,asset.bytes);}
 await writeFile(path.join(dir,'generation.json'),JSON.stringify(gen));
 const descriptor={contractVersion:gen.contractVersion,contentId:gen.contentId,rendererId:renderer.rendererId,activationSeq:seq};
 await mkdir(path.join(root,'activated'),{recursive:true});await writeFile(path.join(root,'activated',gen.contentId+'.json'),JSON.stringify(descriptor));
 await writeFile(path.join(root,'active.json'),JSON.stringify(descriptor));return gen;
}
test('unpacked artifact starts with plain Node, without checkout/CMS/compiler, and accepts content changes without rebuild',async()=>{
 const root=await mkdtemp(path.join(await realpath(os.tmpdir()),'des-art-payload-test-public-artifact-')),unpacked=path.join(root,'release'),contentRoot=path.join(root,'content');let child,exited;
 try{
  await cp(sourceRoot,unpacked,{recursive:true});await mkdir(contentRoot);
  const manifest=await verifyPortfolioArtifact(unpacked),source=fixture(),a=await publish(contentRoot,source,manifest.renderer,1);
  const files=await readdir(unpacked);assert.deepEqual(files.sort(),['ops','preview','release-manifest.json','server.mjs','site']);
  assert.deepEqual((await readdir(path.join(unpacked,'ops'))).sort(),['active-start.mjs','code-cli.mjs']);
  const serverBefore=await readFile(path.join(unpacked,'server.mjs'));assert.equal(serverBefore.includes('/Users/designer/'),false);assert.equal(serverBefore.includes('node:sqlite'),false);
  const port=await freePort(),url='http://127.0.0.1:'+port;
  child=spawn(process.execPath,['server.mjs'],{cwd:unpacked,env:{PORTFOLIO_CONTENT_ROOT:contentRoot,PORTFOLIO_PORT:String(port),NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
  exited=new Promise(resolve=>child.once('exit',resolve));
  let ready=false;
  for(let i=0;i<100;i++){
   if(child.exitCode!==null)throw new Error('Artifact exited: '+output);
   try{if((await fetch(url+'/__internal/health')).status===200){ready=true;break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.equal(ready,true,output);
  const health=await (await fetch(url+'/__internal/health')).json();assert.equal(health.contentId,a.contentId);assert.deepEqual(health.portfolioBuildId,manifest.portfolioBuildId);
  const html=await (await fetch(url+'/')).text();assert.equal(html.includes('/__content/'+a.contentId),true);
  const codeAssets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)].map(m=>m[1]);assert.ok(codeAssets.length>=1);
  const entry=html.match(/<meta name="portfolio-app-entry" content="([^"<>]+)"/);assert.ok(entry,'Persistent shell must declare a real startup entry');
  assert.match(entry[1],/^\/assets\/[^/?]+\.js$/);
  const startup=await fetch(url+entry[1]+'?preloader-attempt=1');assert.equal(startup.status,200);assert.match(await startup.text(),/mountApplication/);
  assert.match(html,/id="early-preloader"/);
  const boff=await fetch(url+'/projects/boff');assert.equal(boff.status,200);assert.match(await boff.text(),/B\.Off/);
  const sitemap=await (await fetch(url+'/sitemap.xml')).text();assert.match(sitemap,/projects\/boff/);
  for(const file of [...codeAssets,'/fonts/onest-variable.woff2','/figma/dot-tile.svg'])assert.equal((await fetch(url+file)).status,200,file);
  for(const asset of a.assets)assert.equal((await fetch(url+'/__content/'+a.contentId+asset.publicPath)).status,200,asset.publicPath);
  const b=fixture();b.projects[0].title='Updated fixture';const next=await publish(contentRoot,b,manifest.renderer,2);
  assert.equal((await (await fetch(url+'/api/site-content')).json()).revision,next.contentId);
  assert.deepEqual(await readFile(path.join(unpacked,'server.mjs')),serverBefore);
  assert.deepEqual((await (await fetch(url+'/__internal/health')).json()).portfolioBuildId,manifest.portfolioBuildId);
  await writeFile(path.join(unpacked,'site','index.html'),'corrupt');await assert.rejects(verifyPortfolioArtifact(unpacked),/integrity/);
 }finally{
  if(child&&child.exitCode===null){child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),12000);await exited;clearTimeout(timer);}
  await rm(root,{recursive:true,force:true});
 }
});
