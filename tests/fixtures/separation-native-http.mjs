import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fixture} from './portfolio-delivery.mjs';
import {createGenerationReader} from '../../tools/portfolio-delivery/reader.mjs';
const sharp=createRequire(new URL('../../tools/payload-admin/package.json',import.meta.url))('sharp');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function exerciseNativeHTTP({origin,publicOrigin,token,publicRoot,renderer}){
 const headers={Authorization:'JWT '+token,Origin:origin,'Content-Type':'application/json',Connection:'close'};
 async function json(url,method='GET',body){const response=await fetch(origin+url,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});const text=await response.text();assert.ok(response.ok,JSON.stringify({url,status:response.status,text}));return JSON.parse(text);}
 const reader=createGenerationReader({root:publicRoot,renderer});const active=()=>reader.readActive({allowLastGood:false});
 const initial=await active();assert.equal(initial.generation.projects.length,0);
 const source=fixture(),png=await sharp({create:{width:2048,height:1479,channels:3,background:'#112233'}}).png().toBuffer(),avif640=await sharp(png).resize({width:640}).avif().toBuffer(),avif1080=await sharp(png).resize({width:1080}).avif().toBuffer();
 function dimensions(value){if(!value||typeof value!=='object')return;if(typeof value.src==='string'&&typeof value.width==='number'){value.width=2048;value.height=1479;}for(const child of Object.values(value))dimensions(child);}
 for(const project of source.projects)dimensions(project.redesign);
 const files=new Map();
 for(const asset of source.assets){asset.bytes=asset.mime==='image/png'?png:asset.publicPath.includes('-640.')?avif640:avif1080;asset.sha256=digest(asset.bytes);if(!files.has(asset.sha256)){const collection=asset.mime==='image/png'?'media':'project-files',form=new FormData();form.set('_payload',JSON.stringify(collection==='media'?{alt:'Separation synthetic HTTP fixture'}:{label:'Separation prepared AVIF'}));form.set('file',new Blob([asset.bytes],{type:asset.mime}),collection==='media'?'fixture.png':'fixture.avif');const response=await fetch(origin+'/api/'+collection,{method:'POST',headers:{Authorization:headers.Authorization,Origin:origin,Connection:'close'},body:form});const text=await response.text();assert.equal(response.status,201,text);const {doc}=JSON.parse(text);files.set(asset.sha256,{relationTo:collection,value:doc.id});const anonymous=await fetch(origin+'/api/'+collection+'/file/'+encodeURIComponent(doc.filename),{headers:{Connection:'close'}});assert.notEqual(anonymous.status,200);await anonymous.arrayBuffer();}}
 const docs=[];for(const project of source.projects){const {doc}=await json('/api/projects?draft=true','POST',{title:project.title,slug:project.slug,releaseContent:project,releaseAssets:source.assets.filter(asset=>asset.publicPath.startsWith('/assets/projects/'+project.slug+'/')).map(asset=>({publicPath:asset.publicPath,file:files.get(asset.sha256)})),_status:'draft'});docs.push(doc);}
 assert.deepEqual((await active()).descriptor,initial.descriptor);
 let counter=0;
 async function intentFor(doc,operation='publish',saved){saved??=(await json('/api/publications?target='+doc.id)).saved;assert.ok(saved);return {operationId:'http_separation_'+String(++counter).padStart(16,'0'),operation,...saved,target:String(doc.id)};}
 async function publish(doc,operation='publish',saved){return json('/api/publications','POST',await intentFor(doc,operation,saved));}
 // Only the selected saved target enters delivery; unrelated drafts remain private.
 const first=await publish(docs[0]);assert.equal(first.status,'delivered',JSON.stringify(first));let delivered=await active();assert.deepEqual(delivered.generation.projects.map(p=>p.slug),[source.projects[0].slug]);
 const oldAssets=[];for(const asset of delivered.generation.assets){const url='/__content/'+delivered.descriptor.contentId+asset.publicPath;const response=await fetch(publicOrigin+url,{headers:{Connection:'close'}});assert.equal(response.status,200);assert.equal(digest(Buffer.from(await response.arrayBuffer())),asset.sha256);oldAssets.push({url,hash:asset.sha256});}
 assert.equal((await publish(docs[1])).status,'delivered');delivered=await active();assert.equal(delivered.generation.projects.length,2);
 const beforeDraft=delivered.descriptor;const draftResponse=await fetch(origin+'/api/projects/'+docs[0].id+'?draft=true',{method:'PATCH',headers,body:JSON.stringify({title:'Private changed draft',_status:'draft'})});assert.equal(draftResponse.status,200,await draftResponse.clone().text());const savedHeaders={target:draftResponse.headers.get('x-payload-saved-target'),expectedRevision:draftResponse.headers.get('x-payload-saved-revision'),sourceDigest:draftResponse.headers.get('x-payload-saved-digest')};assert.equal(savedHeaders.target,String(docs[0].id));assert.match(savedHeaders.expectedRevision??'',/^[a-f0-9]{64}$/);assert.match(savedHeaders.sourceDigest??'',/^[a-f0-9]{64}$/);await draftResponse.arrayBuffer();assert.deepEqual(savedHeaders,(await json('/api/publications?target='+docs[0].id)).saved);assert.deepEqual((await active()).descriptor,beforeDraft);
 const preview=await fetch(origin+'/preview/projects/'+docs[0].id,{headers});assert.equal(preview.status,200);const previewHTML=await preview.text();assert.match(previewHTML,/Private changed draft/);assert.ok(/noindex/.test(preview.headers.get('x-robots-tag')??'')||/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(previewHTML),'Preview must be noindex via headers or metadata');assert.match(preview.headers.get('cache-control')??'',/no-store/);
 const anonymous=await fetch(origin+'/api/projects/'+docs[0].id+'?draft=true',{headers:{Connection:'close'}});assert.notEqual(anonymous.status,200);await anonymous.arrayBuffer();
 const bypass=await fetch(origin+'/api/projects/'+docs[0].id,{method:'PATCH',headers,body:JSON.stringify({_status:'published'})});assert.equal(bypass.status,409,await bypass.text());assert.deepEqual((await active()).descriptor,beforeDraft);
 // A historical completed retry never republishes the old saved draft.
 const receipt=await json('/api/publications','POST',{retryOperationId:first.operationId});assert.equal(receipt.status,'delivered');assert.deepEqual((await active()).descriptor,beforeDraft);
 const savedReceipt=await publish(docs[0],'publish',savedHeaders);assert.equal(savedReceipt.status,'delivered');const savedGeneration=(await active()).generation;assert.equal(savedGeneration.projects.find(project=>project.slug===source.projects[0].slug).title,'Private changed draft');assert.equal(savedGeneration.projects.find(project=>project.slug===source.projects[1].slug).title,source.projects[1].title);
 // Real overlapping HTTP requests exercise the native coordinator and version store.
 async function versionCount(doc){return (await json('/api/projects/versions?'+new URLSearchParams({'where[parent][equals]':String(doc.id),limit:'1'}))).totalDocs;}
 async function saveTitle(doc,title){await json('/api/projects/'+doc.id+'?draft=true','PATCH',{title,_status:'draft'});}
 const beforeParallel=(await active()).descriptor;
 await saveTitle(docs[0],'Concurrent HTTP one');await saveTitle(docs[1],'Concurrent HTTP two');assert.deepEqual((await active()).descriptor,beforeParallel);
 const parallelIntents=await Promise.all(docs.map(doc=>intentFor(doc))),parallelCounts=await Promise.all(docs.map(versionCount));
 const parallelResults=await Promise.all(parallelIntents.map(intent=>json('/api/publications','POST',intent)));assert.ok(parallelResults.every(result=>result.status==='delivered'));
 const parallelActive=await active();assert.equal(parallelActive.descriptor.activationSeq,beforeParallel.activationSeq+2);assert.deepEqual(parallelActive.generation.projects.map(project=>project.title).sort(),['Concurrent HTTP one','Concurrent HTTP two']);
 assert.deepEqual(await Promise.all(docs.map(versionCount)),parallelCounts.map(count=>count+1));
 // The identical operation may arrive twice, but native save/activation occurs once.
 await saveTitle(docs[0],'Concurrent HTTP duplicate');const duplicateIntent=await intentFor(docs[0]),duplicateCount=await versionCount(docs[0]),beforeDuplicate=(await active()).descriptor;
 const duplicateResults=await Promise.all([json('/api/publications','POST',duplicateIntent),json('/api/publications','POST',duplicateIntent)]);assert.ok(duplicateResults.every(result=>result.status==='delivered'));assert.deepEqual(duplicateResults[0].receipt,duplicateResults[1].receipt);assert.equal(await versionCount(docs[0]),duplicateCount+1);assert.equal((await active()).descriptor.activationSeq,beforeDuplicate.activationSeq+1);
 // Different operations captured from one saved revision cannot both commit.
 await saveTitle(docs[0],'Concurrent HTTP fenced');const competingIntent=await intentFor(docs[0]),competingOther={...competingIntent,operationId:'http_separation_'+String(++counter).padStart(16,'0')},competingCount=await versionCount(docs[0]),beforeCompeting=(await active()).descriptor;
 const competingResults=await Promise.all([competingIntent,competingOther].map(async intent=>{const response=await fetch(origin+'/api/publications',{method:'POST',headers,body:JSON.stringify(intent)});return {status:response.status,body:await response.json()};}));assert.deepEqual(competingResults.map(result=>result.status).sort(),[200,409]);assert.equal(competingResults.find(result=>result.status===200).body.status,'delivered');assert.equal(competingResults.find(result=>result.status===409).body.error,'stale-revision');assert.equal(await versionCount(docs[0]),competingCount+1);assert.equal((await active()).descriptor.activationSeq,beforeCompeting.activationSeq+1);assert.equal((await active()).generation.projects.find(project=>project.slug===source.projects[0].slug).title,'Concurrent HTTP fenced');
 // Restore the explicit fixture baseline used by later lifecycle acceptance.
 await saveTitle(docs[0],'Private changed draft');await saveTitle(docs[1],source.projects[1].title);assert.equal((await publish(docs[0])).status,'delivered');assert.equal((await publish(docs[1])).status,'delivered');
 console.log('PASS: overlapping native HTTP different-target publication, identical-operation deduplication and same-revision competing-operation fence preserve content and exact version/activation counts');
 await publish(docs[0],'unpublish');assert.deepEqual((await active()).generation.projects.map(p=>p.slug),[source.projects[1].slug]);await publish(docs[1],'delete');assert.equal((await active()).generation.projects.length,0);
 for(const {url,hash} of oldAssets){const response=await fetch(publicOrigin+url,{headers:{Connection:'close'}});assert.equal(response.status,200);assert.equal(digest(Buffer.from(await response.arrayBuffer())),hash);}
 for(const url of ['/404','/projects/'+source.projects[0].slug,'/projects/'+source.projects[1].slug]){const response=await fetch(publicOrigin+url,{headers:{Connection:'close'}});assert.equal(response.status,404);assert.match(response.headers.get('x-robots-tag')??'',/noindex/);await response.arrayBuffer();}
 const sitemap=await fetch(publicOrigin+'/sitemap.xml',{headers:{Connection:'close'}});assert.equal(sitemap.status,200);assert.doesNotMatch(await sitemap.text(),/fixture-one|fixture-two/);
 console.log('PASS: native HTTP target-only Publish/private saved draft/preview/auth/raw guards/retry/Unpublish/Delete/empty/scoped resource hash retention');
 // Leave a real delivered project active for independent code-update acceptance.
 assert.equal((await publish(docs[0])).status,'delivered');
 const codeBaseline=await active();assert.equal(codeBaseline.generation.projects.length,1);
 const activeAssets=codeBaseline.generation.assets.map(asset=>({url:'/__content/'+codeBaseline.descriptor.contentId+asset.publicPath,hash:asset.sha256}));
 return {oldAssets,activeAssets,previewTarget:docs[0].id};
}
