import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {request} from 'node:http';
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
 // Rejected input must leave both the public generation and native store unchanged.
 const beforeRejected=(await active()).descriptor,mediaBefore=(await json('/api/media?limit=1')).totalDocs;
 const brokenForm=new FormData();brokenForm.set('_payload',JSON.stringify({alt:'Rejected truncated fixture'}));brokenForm.set('file',new Blob([Buffer.from([137,80,78,71,13,10,26,10])],{type:'image/png'}),'truncated.png');
 const brokenUpload=await fetch(origin+'/api/media',{method:'POST',headers:{Authorization:headers.Authorization,Origin:origin,Connection:'close'},body:brokenForm});assert.equal(brokenUpload.status,400,await brokenUpload.text());assert.equal((await json('/api/media?limit=1')).totalDocs,mediaBefore);assert.deepEqual((await active()).descriptor,beforeRejected);
 // Send an unfinished multipart body to the real CMS, then abort that socket.
 const boundary='des-art-separation-partial-upload',prefix=Buffer.from('--'+boundary+'\r\nContent-Disposition: form-data; name="_payload"\r\n\r\n'+JSON.stringify({alt:'Interrupted synthetic fixture'})+'\r\n--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="interrupted.png"\r\nContent-Type: image/png\r\n\r\n'),suffix=Buffer.from('\r\n--'+boundary+'--\r\n'),partial=Buffer.concat([prefix,png.subarray(0,Math.floor(png.length/2))]),fullLength=prefix.length+png.length+suffix.length;
 assert.ok(partial.length<fullLength);
 await new Promise((resolve,reject)=>{
  let written=false,aborting=false,abortTimer;
  const upload=request(origin+'/api/media',{method:'POST',headers:{Authorization:headers.Authorization,Origin:origin,Connection:'close','Content-Type':'multipart/form-data; boundary='+boundary,'Content-Length':fullLength}},response=>{response.resume();reject(new Error('CMS responded before the intentional upload abort'));});
  const deadline=setTimeout(()=>{upload.destroy();reject(new Error('Interrupted upload did not close within its deadline'));},5000);
  upload.on('error',()=>{if(!aborting)reject(new Error('Upload transport failed before the intentional abort'));});
  upload.on('close',()=>{clearTimeout(deadline);clearTimeout(abortTimer);if(written&&aborting)resolve();else reject(new Error('Upload closed before partial bytes were written'));});
  upload.write(partial,error=>{if(error){upload.destroy();reject(new Error('Partial upload bytes were not written'));return;}written=true;abortTimer=setTimeout(()=>{aborting=true;upload.destroy();},100);});
 });
 assert.equal((await json('/api/media?limit=1')).totalDocs,mediaBefore);assert.deepEqual((await active()).descriptor,beforeRejected);
 const invalidSlug='fixture-invalid-publish';
 function invalidPaths(value){if(typeof value==='string')return value.replaceAll('/assets/projects/'+source.projects[0].slug+'/', '/assets/projects/'+invalidSlug+'/');if(Array.isArray(value))return value.map(invalidPaths);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,invalidPaths(child)]));return value;}
 const invalidContent=invalidPaths(source.projects[0]);invalidContent.slug=invalidSlug;invalidContent.redesign.page.summary=[[{type:'future-invalid-block',text:'Rejected fixture'}]];
 const {doc:invalidDoc}=await json('/api/projects?draft=true','POST',{title:'Rejected invalid block',slug:invalidSlug,releaseContent:invalidContent,releaseAssets:source.assets.filter(asset=>asset.publicPath.startsWith('/assets/projects/'+source.projects[0].slug+'/')).map(asset=>({publicPath:invalidPaths(asset.publicPath),file:files.get(asset.sha256)})),_status:'draft'});
 const invalidVersions='/api/projects/versions?'+new URLSearchParams({'where[parent][equals]':String(invalidDoc.id),limit:'1'}),invalidCount=(await json(invalidVersions)).totalDocs;
 const rejected=await fetch(origin+'/api/publications',{method:'POST',headers,body:JSON.stringify(await intentFor(invalidDoc))});assert.equal(rejected.status,409);assert.equal((await rejected.json()).error,'delivery-failed');assert.equal((await json(invalidVersions)).totalDocs,invalidCount);assert.equal((await json('/api/projects/'+invalidDoc.id+'?draft=true'))._status,'draft');assert.deepEqual((await active()).descriptor,beforeRejected);
 // Re-read delivered bytes as well as the pointer: refusal must not damage resources.
 for(const asset of savedGeneration.assets){const response=await fetch(publicOrigin+'/__content/'+beforeRejected.contentId+asset.publicPath,{headers:{Connection:'close'}});assert.equal(response.status,200);assert.equal(digest(Buffer.from(await response.arrayBuffer())),asset.sha256);}
 console.log('PASS: interrupted multipart/truncated-image upload and unsupported-block Publish are rejected without media/version/public activation changes; delivered asset bytes remain intact');
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
 // Discard the actual HTTP response body after successful headers, then replay.
 await saveTitle(docs[0],'Lost HTTP response');const lostHTTPIntent=await intentFor(docs[0]),beforeLostCount=await versionCount(docs[0]),beforeLostActive=(await active()).descriptor,lostBody=JSON.stringify(lostHTTPIntent);
 await new Promise((resolve,reject)=>{
  let discarded=false;
  const publication=request(origin+'/api/publications',{method:'POST',headers:{...headers,'Content-Length':Buffer.byteLength(lostBody)}},response=>{
   if(response.statusCode!==200){response.destroy();publication.destroy();reject(new Error('Publication did not succeed before response-body interruption'));return;}
   discarded=true;response.destroy();publication.destroy();
  });
  const deadline=setTimeout(()=>{publication.destroy();reject(new Error('Lost-response publication exceeded its deadline'));},10000);
  publication.on('error',()=>{if(!discarded)reject(new Error('Transport failed before publication response headers'));});
  publication.on('close',()=>{clearTimeout(deadline);if(discarded)resolve();else reject(new Error('Publication closed before response-body interruption'));});
  publication.end(lostBody);
 });
 const afterLostActive=(await active()).descriptor;assert.equal(await versionCount(docs[0]),beforeLostCount+1);assert.equal(afterLostActive.activationSeq,beforeLostActive.activationSeq+1);
 const recoveredHTTP=await json('/api/publications','POST',lostHTTPIntent);assert.equal(recoveredHTTP.status,'delivered');assert.equal(recoveredHTTP.receipt.operationId,lostHTTPIntent.operationId);assert.equal(recoveredHTTP.receipt.contentId,afterLostActive.contentId);assert.equal(recoveredHTTP.receipt.activationSeq,afterLostActive.activationSeq);assert.equal(await versionCount(docs[0]),beforeLostCount+1);assert.deepEqual((await active()).descriptor,afterLostActive);
 console.log('PASS: discarded actual HTTP publication response body replays without a duplicate native version or public activation');
 // Different operations captured from one saved revision cannot both commit.
 await saveTitle(docs[0],'Concurrent HTTP fenced');const competingIntent=await intentFor(docs[0]),competingOther={...competingIntent,operationId:'http_separation_'+String(++counter).padStart(16,'0')},competingCount=await versionCount(docs[0]),beforeCompeting=(await active()).descriptor;
 const competingResults=await Promise.all([competingIntent,competingOther].map(async intent=>{const response=await fetch(origin+'/api/publications',{method:'POST',headers,body:JSON.stringify(intent)});return {status:response.status,body:await response.json()};}));assert.deepEqual(competingResults.map(result=>result.status).sort(),[200,409]);assert.equal(competingResults.find(result=>result.status===200).body.status,'delivered');assert.equal(competingResults.find(result=>result.status===409).body.error,'stale-revision');assert.equal(await versionCount(docs[0]),competingCount+1);assert.equal((await active()).descriptor.activationSeq,beforeCompeting.activationSeq+1);assert.equal((await active()).generation.projects.find(project=>project.slug===source.projects[0].slug).title,'Concurrent HTTP fenced');
 // Restore the explicit fixture baseline used by later lifecycle acceptance.
 await saveTitle(docs[0],'Private changed draft');await saveTitle(docs[1],source.projects[1].title);assert.equal((await publish(docs[0])).status,'delivered');assert.equal((await publish(docs[1])).status,'delivered');
 console.log('PASS: overlapping native HTTP different-target publication, identical-operation deduplication and same-revision competing-operation fence preserve content and exact version/activation counts');
 // Stable native target can rename its public route and update catalog/home metadata.
 const beforeRenameState=await active(),beforeRename=beforeRenameState.descriptor,beforeRenameOther=beforeRenameState.generation.projects.find(project=>project.slug===source.projects[1].slug),renamedSlug='fixture-renamed',renamed=structuredClone(source.projects[0]);renamed.slug=renamedSlug;renamed.catalogOrder=10;renamed.homePlacement='secondary';renamed.visuals.home={templateId:'home.sarafan-radio',assets:structuredClone(renamed.visuals.catalog.assets)};
 await json('/api/projects/'+docs[0].id+'?draft=true','PATCH',{slug:renamedSlug,releaseContent:renamed,_status:'draft'});assert.deepEqual((await active()).descriptor,beforeRename);
 assert.equal((await publish(docs[0])).status,'delivered');const renamedActive=await active();assert.deepEqual(renamedActive.generation.projects.map(project=>project.slug),[source.projects[1].slug,renamedSlug]);assert.equal(renamedActive.generation.projects[1].homePlacement,'secondary');assert.deepEqual(renamedActive.generation.projects[0],beforeRenameOther);
 for(const [route,status] of [['/projects/'+source.projects[0].slug,404],['/projects/'+renamedSlug,200]]){const response=await fetch(publicOrigin+route,{headers:{Connection:'close'}});assert.equal(response.status,status);await response.arrayBuffer();}
 async function siteDTO(){const response=await fetch(publicOrigin+'/',{headers:{Connection:'close'}});assert.equal(response.status,200);const html=await response.text(),match=html.match(/<script id="portfolio-projects" type="application\/json">(.*?)<\/script>/s);assert.ok(match);return JSON.parse(match[1]).projects;}
 assert.deepEqual((await siteDTO()).map(project=>project.slug),[source.projects[1].slug,renamedSlug]);assert.equal((await siteDTO())[1].homePlacement,'secondary');
 const renamedSitemap=await(await fetch(publicOrigin+'/sitemap.xml')).text();assert.ok(renamedSitemap.includes('/projects/'+renamedSlug));assert.ok(!renamedSitemap.includes('/projects/'+source.projects[0].slug));
 const withoutDetail={...renamed,detailAvailable:false};await json('/api/projects/'+docs[0].id+'?draft=true','PATCH',{releaseContent:withoutDetail,_status:'draft'});assert.equal((await publish(docs[0])).status,'delivered');assert.equal((await siteDTO()).find(project=>project.slug===renamedSlug).detailAvailable,false);assert.equal((await fetch(publicOrigin+'/projects/'+renamedSlug)).status,404);assert.ok(!(await(await fetch(publicOrigin+'/sitemap.xml')).text()).includes('/projects/'+renamedSlug));
 // Keep the later cold-restart/code-update fixture baseline explicit.
 await json('/api/projects/'+docs[0].id+'?draft=true','PATCH',{slug:source.projects[0].slug,releaseContent:source.projects[0],_status:'draft'});assert.equal((await publish(docs[0])).status,'delivered');assert.equal((await active()).generation.projects.find(project=>project.slug===source.projects[0].slug).homePlacement,undefined);
 console.log('PASS: native slug/catalog order/home placement/no-detail publication updates public routes, injected navigation data and sitemap without other-target changes');
 await publish(docs[0],'unpublish');assert.deepEqual((await active()).generation.projects.map(p=>p.slug),[source.projects[1].slug]);await publish(docs[1],'delete');assert.equal((await active()).generation.projects.length,0);
 for(const {url,hash} of oldAssets){const response=await fetch(publicOrigin+url,{headers:{Connection:'close'}});assert.equal(response.status,200);assert.equal(digest(Buffer.from(await response.arrayBuffer())),hash);}
 for(const url of ['/404','/projects/'+source.projects[0].slug,'/projects/'+source.projects[1].slug]){const response=await fetch(publicOrigin+url,{headers:{Connection:'close'}});assert.equal(response.status,404);assert.match(response.headers.get('x-robots-tag')??'',/noindex/);await response.arrayBuffer();}
 const sitemap=await fetch(publicOrigin+'/sitemap.xml',{headers:{Connection:'close'}});assert.equal(sitemap.status,200);assert.doesNotMatch(await sitemap.text(),/fixture-one|fixture-two/);
 console.log('PASS: native HTTP target-only Publish/private saved draft/preview/auth/raw guards/retry/Unpublish/Delete/empty/scoped resource hash retention');
 // Leave a real delivered project active for independent code-update acceptance.
 const completedPublication=await publish(docs[0]);assert.equal(completedPublication.status,'delivered');
 const codeBaseline=await active();assert.ok(completedPublication.receipt);assert.equal(completedPublication.receipt.operationId,completedPublication.operationId);assert.equal(completedPublication.receipt.contentId,codeBaseline.descriptor.contentId);assert.equal(completedPublication.receipt.activationSeq,codeBaseline.descriptor.activationSeq);assert.equal(codeBaseline.generation.projects.length,1);assert.equal((await json('/api/media?limit=1')).totalDocs,mediaBefore);
 const activeAssets=codeBaseline.generation.assets.map(asset=>({url:'/__content/'+codeBaseline.descriptor.contentId+asset.publicPath,hash:asset.sha256}));
 return {oldAssets,activeAssets,previewTarget:docs[0].id,completedPublication};
}
