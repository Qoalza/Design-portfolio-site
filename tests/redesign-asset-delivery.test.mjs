import assert from 'node:assert/strict';
import http from 'node:http';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {exportApprovedRedesign} from '../tools/concept-v2/export-approved-content.mjs';
import {createApprovedAssetMiddleware} from '../tools/concept-v2/approved-content-vite.mjs';
const prepared=await exportApprovedRedesign({repoRoot:fileURLToPath(new URL('..',import.meta.url))});
const source=prepared.projects[0].redesign.hero.scenes[0].source;
const base=source.assetBase;
async function withServer(callback){
 const fixture={...prepared,projects:structuredClone(prepared.projects),assets:[...prepared.assets]};
 const additions=[['module.mjs','export const ready=true;','text/javascript'],['font.woff2','fixture-font','font/woff2']];
 for(const [name,text,mime] of additions){const bytes=Buffer.from(text);fixture.assets.push({publicPath:base+name,bytes});for(const scene of fixture.projects[0].redesign.hero.scenes)scene.source.files.push({path:name,size:bytes.length,mime,sha256:createHash('sha256').update(bytes).digest('hex')});}
 fixture.assets.push({publicPath:base+'unlisted.js',bytes:Buffer.from('unlisted')});

 const middleware=createApprovedAssetMiddleware(fixture);
 const server=http.createServer((req,res)=>middleware(req,res,()=>{res.statusCode=418;res.end('downstream');}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{await callback(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(resolve=>server.close(resolve));}
}
test('package documents have enforced sandbox/CSP even when opened directly and preserve bytes',async()=>withServer(async host=>{
 for(const scene of prepared.projects[0].redesign.hero.scenes){const asset=prepared.assets.find(a=>a.publicPath===scene.source.assetBase+scene.source.entry),response=await fetch(host+asset.publicPath+'?proof=1');assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/html');assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.equal(response.headers.get('x-content-type-options'),'nosniff');const csp=response.headers.get('content-security-policy');for(const rule of ['sandbox allow-scripts','default-src \'none\'','connect-src \'none\'','object-src \'none\'','base-uri \'none\'','form-action \'none\'','frame-src \'none\''])assert.ok(csp.includes(rule),rule);assert.ok(!csp.includes('allow-same-origin'));assert.ok(csp.includes('https://fonts.googleapis.com'));assert.ok(csp.includes('https://fonts.gstatic.com'));assert.deepEqual(Buffer.from(await response.arrayBuffer()),asset.bytes);}
}));
test('opaque iframe modules/fonts get correct MIME and credential-free CORS only on approved package assets',async()=>withServer(async host=>{
 for(const [file,mime] of [['module.mjs','text/javascript'],['font.woff2','font/woff2'],['shared/base.css','text/css']]){const response=await fetch(host+base+file,{headers:{Origin:'null'}});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),mime);assert.equal(response.headers.get('access-control-allow-origin'),'*');assert.equal(response.headers.get('access-control-allow-credentials'),null);}
 for(const url of ['/api/private','/unknown',prepared.assets.find(a=>!a.publicPath.startsWith(base)).publicPath]){const response=await fetch(host+url);assert.equal(response.headers.get('access-control-allow-origin'),null);assert.equal(response.headers.get('content-security-policy'),null);}
}));
test('package missing files fail as 404 instead of falling into the portfolio; methods and HEAD are deterministic',async()=>withServer(async host=>{
 for(const name of ['missing.js','unlisted.js']){const missing=await fetch(host+base+name);assert.equal(missing.status,404);assert.equal(await missing.text(),'Not found');assert.equal(missing.headers.get('access-control-allow-origin'),null);}
 const url=host+base+source.entry,head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.ok(Number(head.headers.get('content-length'))>0);
 const post=await fetch(url,{method:'POST'});assert.equal(post.status,405);assert.equal(post.headers.get('allow'),'GET, HEAD');
}));
