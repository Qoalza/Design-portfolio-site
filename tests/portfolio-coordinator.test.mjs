import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createPublicationCoordinator,PublicationError,ReadinessRejected} from '../tools/portfolio-delivery/coordinator.mjs';
import {createGenerationReader} from '../tools/portfolio-delivery/reader.mjs';
import {contentHash,canonicalJSON,DELIVERY_CAPABILITIES} from '../tools/portfolio-delivery/contract.mjs';
import {fixture} from './fixtures/portfolio-delivery.mjs';
const renderer={rendererId:'a'.repeat(64),contractVersion:'public-delivery-v1',capabilities:DELIVERY_CAPABILITIES};
const hash=value=>contentHash(canonicalJSON(value));
async function environment({empty=false}={}) {
 const root=await mkdtemp('/private/tmp/publication-coordinator-'),publicRoot=path.join(root,'public'),privateRoot=path.join(root,'private');
 const source=fixture(),records=new Map(source.projects.map((project,index)=>[String(index+1),{project:structuredClone(project),status:'draft',version:1}])),commits=new Map();
 let writes=0,fail=null;
 const current=intent=>{const row=records.get(intent.target);return row?{revision:hash({version:row.version,status:row.status,project:row.project}),digest:hash(row.project)}:null;};
 const delta=(row)=>({project:structuredClone(row.project),assets:source.assets.filter(asset=>asset.publicPath.startsWith(`/assets/projects/${row.project.slug}/`)),externalDependencies:[]});
 const native={
  current:async intent=>current(intent),
  prepare:async intent=>{
   if(current(intent)?.revision!==intent.expectedRevision)throw new PublicationError('stale-revision');
   const row=records.get(intent.target);
   return {...(['publish','restore'].includes(intent.operation)?delta(row):{}),sourceDigest:hash(row.project),selectedRevision:'saved-'+row.version};
  },
  commit:async intent=>{
   if(current(intent)?.revision!==intent.expectedRevision)throw new PublicationError('stale-revision');
   if(fail==='native-before')throw new Error('Native commit failed');
   const row=records.get(intent.target);writes++;
   if(intent.operation==='delete')records.delete(intent.target);else {row.version++;row.status=['publish','restore'].includes(intent.operation)?'published':'draft';}
   const result={current:current(intent),revision:'native-'+writes};commits.set(intent.operationId,result);
   if(fail==='native-after')throw new Error('Commit response lost');return result;
  },
  delivery:async journal=>['publish','restore'].includes(journal.intent.operation)?delta(records.get(journal.intent.target)): {},
  recover:async journal=>commits.has(journal.intent.operationId)?{state:'committed',result:commits.get(journal.intent.operationId)}:{state:'ambiguous'},
 };
 const reader=createGenerationReader({root:publicRoot,renderer});
 const probe=async request=>{
  if(fail==='probe'&&request.kind==='candidate')throw new Error('Reader unavailable');
  const handle=request.kind==='active'?await reader.readActive({allowLastGood:false}):await reader.readGeneration(request.contentId);
  if(request.kind==='active'){assert.deepEqual(handle.descriptor,request.descriptor);if(fail==='active-rejected'&&request.descriptor.activationSeq>0)throw new ReadinessRejected();}
  else assert.equal(handle.generation.contentId,request.contentId);
 };
 const fault=async point=>{if(point===fail)throw new Error('Injected '+point);};
 const make=()=>createPublicationCoordinator({publicRoot,privateRoot,renderer,native,probe,fault});
 const coordinator=make();
 const prepared=empty?{projects:[],assets:[],externalDependencies:[]}:source;
 await coordinator.initialize({prepared,mapping:empty?[]:source.projects.map((project,index)=>({target:String(index+1),slug:project.slug,externalDependencies:[]}))});
 let operation=0;
 const intent=(target,kind='publish',key)=>({operationId:key??'operation_'+String(++operation).padStart(16,'0'),target,actor:'1',operation:kind,expectedRevision:current({target}).revision,sourceDigest:hash(records.get(target).project)});
 return {root,coordinator,make,reader,records,current,intent,source,get writes(){return writes;},set fail(value){fail=value;},cleanup:()=>rm(root,{recursive:true,force:true})};
}
test('target delta leaves other native drafts and pending publication out of public generation; retry rebases',async()=>{
 const env=await environment();try {
  const original=(await env.coordinator.active()).generation;
  env.records.get('1').project.title='Pending one';env.fail='probe';const first=env.intent('1');
  assert.equal((await env.coordinator.execute(first)).status,'pending');assert.equal(env.writes,1);
  assert.equal((await env.coordinator.active()).generation.contentId,original.contentId);
  env.fail=null;env.records.get('2').project.title='Delivered two';
  assert.equal((await env.coordinator.execute(env.intent('2'))).status,'delivered');
  let projects=(await env.coordinator.active()).generation.projects;assert.equal(projects[0].title,'fixture-one');assert.equal(projects[1].title,'Delivered two');
  assert.equal((await env.make().execute(first)).status,'delivered');assert.equal(env.writes,2);
  projects=(await env.coordinator.active()).generation.projects;assert.equal(projects[0].title,'Pending one');assert.equal(projects[1].title,'Delivered two');
 }finally{await env.cleanup();}
});
test('lost response after activation and completed retry with newer draft return receipt without native save',async()=>{
 const env=await environment();try {
  env.records.get('1').project.title='Activated';const intent=env.intent('1');env.fail='after-activation';
  assert.equal((await env.coordinator.execute(intent)).status,'activating');assert.equal(env.writes,1);
  assert.equal((await env.coordinator.active()).generation.projects[0].title,'Activated');
  env.fail=null;const retry=await env.make().execute(intent);assert.equal(retry.status,'delivered');assert.equal(env.writes,1);
  env.records.get('1').project.title='Private new draft';env.records.get('1').version++;
  assert.deepEqual(await env.make().execute(intent),retry);assert.equal(env.writes,1);
  await assert.rejects(()=>env.coordinator.execute({...intent,operation:'unpublish'}),error=>error.code==='idempotency-conflict');
 }finally{await env.cleanup();}
});
test('staging/native failures retain previous active state and uncertain commit is never blindly repeated',async()=>{
 for(const fail of ['staging','native-before','native-after']) {
  const env=await environment();try {
   const old=(await env.coordinator.active()).descriptor;env.records.get('1').project.title='Selected';const intent=env.intent('1');env.fail=fail;
   const result=await env.coordinator.execute(intent);assert.notEqual(result.status,'delivered');assert.deepEqual((await env.coordinator.active()).descriptor,old);
   env.fail=null;const retry=await env.make().execute(intent);
   if(fail==='native-before'){assert.equal(retry.error,'commit-uncertain');assert.equal(env.writes,0);}
   else {assert.equal(retry.status,'delivered');assert.equal(env.writes,1);}
  }finally{await env.cleanup();}
 }
});
test('explicit pending retry conflicts after draft change; later target operation supersedes old pending',async()=>{
 const env=await environment();try {
  env.fail='probe';const older=env.intent('1');await env.coordinator.execute(older);
  env.records.get('1').project.title='Later';env.records.get('1').version++;env.fail=null;
  assert.equal((await env.coordinator.execute(older)).error,'stale-revision');
  const newIntent=env.intent('1');env.fail='probe';await env.coordinator.execute(newIntent);env.fail=null;
  assert.equal((await env.coordinator.execute(env.intent('1'))).status,'delivered');
  assert.equal((await env.coordinator.execute(newIntent)).status,'superseded');
 }finally{await env.cleanup();}
});
test('unpublish/delete incomplete targets and last project produce empty collection while old bytes remain readable',async()=>{
 const env=await environment();try {
  const old=await env.coordinator.active(),oldAsset=env.source.assets[0];
  env.records.get('1').project={invalid:'Draft missing assets'};
  assert.equal((await env.coordinator.execute(env.intent('1','unpublish'))).status,'delivered');
  env.records.get('2').project={invalid:'Draft missing assets'};
  assert.equal((await env.coordinator.execute(env.intent('2','delete'))).status,'delivered');
  assert.equal((await env.coordinator.active()).generation.projects.length,0);
  assert.deepEqual(await (await env.reader.readActivated(old.generation.contentId)).readAsset(oldAsset.publicPath),oldAsset.bytes);
 }finally{await env.cleanup();}
});
test('new empty collection can publish first target; concurrent different targets serialize and preserve both',async()=>{
 const env=await environment({empty:true});try {
  const results=await Promise.all([env.coordinator.execute(env.intent('1')),env.coordinator.execute(env.intent('2'))]);
  assert.equal(results.every(result=>result.status==='delivered'),true);assert.equal(env.writes,2);assert.equal((await env.coordinator.active()).generation.projects.length,2);
  assert.equal((await env.coordinator.status({actor:'9'})).length,0);
  assert.equal((await env.coordinator.status({actor:'1',target:'1'})).length,1);
 }finally{await env.cleanup();}
});
test('invalid candidate and private active map corruption stop before native mutation',async()=>{
 const env=await environment();try {
  env.records.get('1').project.homePlacement='not-a-placement';const result=await env.coordinator.execute(env.intent('1'));assert.equal(result.status,'failed');assert.equal(env.writes,0);
  const descriptor=(await env.coordinator.active()).descriptor;
  const file=path.join(env.root,'private','states',`${descriptor.activationSeq}-${descriptor.contentId}-${descriptor.rendererId}.json`);
  const state=JSON.parse(await readFile(file,'utf8'));state.projects[0].target=state.projects[1].target;await writeFile(file,JSON.stringify(state));
  await assert.rejects(()=>env.coordinator.active(),error=>error.code==='invalid-active-map');
 }finally{await env.cleanup();}
});

test('confirmed active readiness rejection returns last-good with a higher sequence; explicit retry can deliver',async()=>{
 // A transport timeout is uncertain; only an explicit reader rejection rolls
 // back. This test observes B before rejection to exercise the sequence guard.
 const env=await environment();try {
  const initial=await env.coordinator.active();
  // Replace the boundary through a separate coordinator using the same adapter
  // via a controlled test failure exposed by the fixture probe below.
  env.fail='active-rejected';env.records.get('1').project.title='Rejected';
  const intent=env.intent('1'),result=await env.coordinator.execute(intent);
  assert.equal(result.status,'pending');
  const restored=await env.coordinator.active();assert.equal(restored.generation.contentId,initial.generation.contentId);assert.equal(restored.descriptor.activationSeq,2);
  env.fail=null;assert.equal((await env.make().execute(intent)).status,'delivered');assert.equal(env.writes,1);
 }finally{await env.cleanup();}
});


test('lost receipt remains delivered after another target activation and a newer draft, without reactivation',async()=>{
 const env=await environment();try {
  env.records.get('1').project.title='A actually activated';const first=env.intent('1');env.fail='after-activation';
  const lost=await env.coordinator.execute(first);assert.equal(lost.status,'activating');
  const firstDescriptor=(await env.coordinator.active()).descriptor;env.fail=null;
  env.records.get('2').project.title='Later other project';assert.equal((await env.coordinator.execute(env.intent('2'))).status,'delivered');
  const later=(await env.coordinator.active()).descriptor;
  env.records.get('1').project.title='New private draft';env.records.get('1').version++;
  const result=await env.make().execute(first);assert.equal(result.status,'delivered');assert.equal(result.receipt.activationSeq,firstDescriptor.activationSeq);
  assert.deepEqual((await env.coordinator.active()).descriptor,later);assert.equal(env.writes,2);
 }finally{await env.cleanup();}
});


test('explicit retry after lost activation response rolls back a confirmed readiness rejection',async()=>{
 const env=await environment();try {
  const old=await env.coordinator.active();env.records.get('1').project.title='Not ready';const intent=env.intent('1');
  env.fail='after-activation';assert.equal((await env.coordinator.execute(intent)).status,'activating');
  env.fail='active-rejected';const retry=await env.make().execute(intent);assert.equal(retry.status,'pending');
  assert.equal((await env.coordinator.active()).generation.contentId,old.generation.contentId);assert.equal((await env.coordinator.active()).descriptor.activationSeq,2);
  env.fail=null;assert.equal((await env.make().execute(intent)).status,'delivered');assert.equal(env.writes,1);
 }finally{await env.cleanup();}
});


test('loopback probe checks actual standalone reader identities and rejects invalid candidates',async()=>{
 const env=await environment();const {createLoopbackProbe}=await import('../tools/portfolio-delivery/probe.mjs');
 const {createPortfolioServer}=await import('../tools/portfolio-runtime/server.mjs');
 const server=createPortfolioServer({siteRoot:env.root,contentRoot:path.join(env.root,'public'),renderer});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const probe=createLoopbackProbe('http://127.0.0.1:'+server.address().port),descriptor=(await env.coordinator.active()).descriptor;
  await probe({kind:'active',descriptor});await probe({kind:'candidate',contentId:descriptor.contentId,rendererId:renderer.rendererId});
  await assert.rejects(()=>probe({kind:'candidate',contentId:'f'.repeat(64),rendererId:renderer.rendererId}),error=>error.code==='candidate-rejected');
  await assert.rejects(()=>probe({kind:'active',descriptor:{...descriptor,activationSeq:999}}),ReadinessRejected);
  await writeFile(path.join(env.root,'public/active.json'),'corrupt');await assert.rejects(()=>probe({kind:'active',descriptor}),ReadinessRejected);
  for(const origin of ['http://localhost:1234','https://127.0.0.1:1234','http://127.0.0.1:1234/path','http://secret@127.0.0.1:1234'])assert.throws(()=>createLoopbackProbe(origin),/fixed IPv4/);
 }finally{await new Promise(resolve=>server.close(resolve));await env.cleanup();}
});
