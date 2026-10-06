import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { open, constants, rename, rm } from 'node:fs/promises';
import { DELIVERY_VERSION, canonicalJSON, digestPattern, exactObject, createDeliveryGeneration, validateActiveDescriptor, validateRenderer, validateAssetBytes } from './contract.mjs';
import { createGenerationReader } from './reader.mjs';
import { assertDirectory, atomicJSON, readJSON, writeFileDurable, flushDirectory, withActivationLock, listJSON } from './durable-store.mjs';

export class ReadinessRejected extends Error {
 constructor() {super('Public reader rejected the activated generation.');this.name='ReadinessRejected';}
}
export class PublicationError extends Error {
 constructor(code,message=code) {super(message);this.name='PublicationError';this.code=code;}
}
const operationKinds=new Set(['publish','unpublish','delete','restore']);
const queues=new Map();
function serial(root,task) {
 const previous=queues.get(root)??Promise.resolve();
 const result=previous.catch(()=>{}).then(task);
 const idle=result.then(()=>{},()=>{});
 queues.set(root,idle);
 idle.then(()=>{if(queues.get(root)===idle)queues.delete(root);});
 return result;
}
export function validateIntent(value) {
 exactObject(value,['operationId','target','actor','operation','expectedRevision','sourceDigest','selectedVersionId'],'Publication intent');
 if(typeof value.operationId!=='string'||!/^[a-zA-Z0-9_-]{16,128}$/.test(value.operationId)||typeof value.target!=='string'||!/^\d{1,16}$/.test(value.target)||typeof value.actor!=='string'||!/^\d{1,16}$/.test(value.actor)||!operationKinds.has(value.operation)||typeof value.expectedRevision!=='string'||!digestPattern.test(value.expectedRevision)||!digestPattern.test(value.sourceDigest))throw new PublicationError('invalid-intent');
 if(value.operation==='restore' ? typeof value.selectedVersionId!=='string'||!/^\d{1,16}$/.test(value.selectedVersionId) : value.selectedVersionId!==undefined)throw new PublicationError('invalid-intent');
 return structuredClone(value);
}
function stateName(descriptor) {return `${descriptor.activationSeq}-${descriptor.contentId}-${descriptor.rendererId}.json`;}
function sameDescriptor(a,b) {return canonicalJSON(a)===canonicalJSON(b);}
function validateMap(state,descriptor,generation) {
 exactObject(state,['descriptor','projects','latest'],'Private active map');
 if(!sameDescriptor(state.descriptor,descriptor)||!Array.isArray(state.projects)||!state.latest||typeof state.latest!=='object'||Array.isArray(state.latest))throw new PublicationError('invalid-active-map');
 const targets=new Set(),slugs=new Set();
 for(const item of state.projects) {
  exactObject(item,['target','slug','externalDependencies'],'Private project map');
  if(typeof item.target!=='string'||!/^\d{1,16}$/.test(item.target)||typeof item.slug!=='string'||!Array.isArray(item.externalDependencies)||item.externalDependencies.some(url=>typeof url!=='string')||targets.has(item.target)||slugs.has(item.slug)||!generation.projects.some(project=>project.slug===item.slug))throw new PublicationError('invalid-active-map');
  targets.add(item.target);slugs.add(item.slug);
 }
 if(slugs.size!==generation.projects.length||Object.entries(state.latest).some(([target,value])=>!/^\d{1,16}$/.test(target)||!Number.isSafeInteger(value)||value<1)||canonicalJSON([...new Set(state.projects.flatMap(item=>item.externalDependencies))].sort())!==canonicalJSON(generation.externalDependencies))throw new PublicationError('invalid-active-map');
 return state;
}
// Lifecycle owner supplies an already-locked native adapter and a loopback probe.
// No Payload import, authoring store path, credential or raw upload crosses here.
export function createPublicationCoordinator({publicRoot,privateRoot,renderer,native,probe,fault=async()=>{}}) {
 publicRoot=path.resolve(publicRoot);privateRoot=path.resolve(privateRoot);
 if(publicRoot===privateRoot||publicRoot.startsWith(privateRoot+path.sep)||privateRoot.startsWith(publicRoot+path.sep))throw new Error('Public and private delivery roots must be separate.');
 validateRenderer(renderer);
 const reader=createGenerationReader({root:publicRoot,renderer});
 const journalRoot=path.join(privateRoot,'operations'),states=path.join(privateRoot,'states'),history=path.join(privateRoot,'activations');
 async function roots() {await assertDirectory(publicRoot);await assertDirectory(privateRoot,{create:true});await assertDirectory(journalRoot,{create:true});await assertDirectory(states,{create:true});await assertDirectory(history,{create:true});}
 async function active() {
  const handle=await reader.readActive({allowLastGood:false});
  const state=validateMap(await readJSON(path.join(states,stateName(handle.descriptor))),handle.descriptor,handle.generation);
  return {...handle,state};
 }
 async function save(journal) {await atomicJSON(path.join(journalRoot,journal.intent.operationId+'.json'),journal);}
 async function stage(candidate,assets) {
  const staging=path.join(privateRoot,'staging',randomUUID());
  await assertDirectory(staging,{create:true});
  const byPath=new Map(assets.map(asset=>[asset.publicPath,asset.bytes]));
  for(const asset of candidate.assets)await writeFileDurable(path.join(staging,asset.publicPath.slice(1)),byPath.get(asset.publicPath));
  await writeFileDurable(path.join(staging,'generation.json'),Buffer.from(canonicalJSON(candidate)));
  await flushDirectory(staging);
  return staging;
 }
 async function promote(staging,candidate) {
  const parent=path.join(publicRoot,'generations');await assertDirectory(parent,{create:true,mode:0o755});
  const destination=path.join(parent,candidate.contentId);
  try {await reader.readGeneration(candidate.contentId);return;}
  catch(error) {if(error.code!=='ENOENT')throw error;}
  // Copy after native commit: private staging is never mounted in public root.
  const incoming=path.join(parent,'.incoming-'+randomUUID());
  await assertDirectory(incoming,{create:true,mode:0o755});
  try {
   for(const asset of candidate.assets) {
    const source=path.join(staging,asset.publicPath.slice(1));
    // Read bytes through a temporary reader to retain checksum/path validation.
    await assertDirectory(path.dirname(source));
    const file=await open(source,constants.O_RDONLY|constants.O_NOFOLLOW);
    let bytes;try {bytes=await file.readFile();}finally{await file.close();}
    validateAssetBytes(asset,bytes);
    await writeFileDurable(path.join(incoming,asset.publicPath.slice(1)),bytes,0o644);
   }
   await writeFileDurable(path.join(incoming,'generation.json'),Buffer.from(canonicalJSON(candidate)),0o644);
   await flushDirectory(incoming);await rename(incoming,destination);await flushDirectory(parent);
  } finally {await rm(incoming,{recursive:true,force:true});}
  await reader.readGeneration(candidate.contentId);
 }
 async function build(base,delta,intent) {
  const removed=base.state.projects.find(item=>item.target===intent.target);
  const projects=base.generation.projects.filter(project=>project.slug!==removed?.slug);
  const map=base.state.projects.filter(item=>item.target!==intent.target);
  const assets=[];
  const retainedSlugs=new Set(projects.map(project=>project.slug));
  for(const asset of base.generation.assets) if([...retainedSlugs].some(slug=>asset.publicPath.startsWith(`/assets/projects/${slug}/`)))assets.push({...asset,bytes:await base.readAsset(asset.publicPath)});
  if(delta.project) {
   projects.push(delta.project);assets.push(...delta.assets);
   map.push({target:intent.target,slug:delta.project.slug,externalDependencies:delta.externalDependencies});
  }
  const externalDependencies=[...new Set(map.flatMap(item=>item.externalDependencies))];
  const candidate=createDeliveryGeneration({projects,assets,externalDependencies},renderer);
  // Digest aliases are immutable for every retained activated generation.
  for(const asset of candidate.assets) if(/\/hero-layout\/[a-f0-9]{64}\//.test(asset.publicPath)) {
   const old=await reader.immutableAlias(asset.publicPath);
   if(old&&(old.asset.sha256!==asset.sha256||old.asset.mime!==asset.mime))throw new PublicationError('immutable-alias-conflict');
  }
  return {candidate,map,assets};
 }
 async function rejectActivation(journal) {
  const observed=validateActiveDescriptor(await readJSON(path.join(publicRoot,'active.json'),4096));
  if(!journal.activation||!journal.base||!sameDescriptor(observed,journal.activation))return;
  const previous=validateActiveDescriptor(journal.base);
  const generation=(await reader.readGeneration(previous.contentId)).generation;
  const state=validateMap(await readJSON(path.join(states,stateName(previous))),previous,generation);
  const rollback={...previous,activationSeq:observed.activationSeq+1};
  await atomicJSON(path.join(states,stateName(rollback)),{...state,descriptor:rollback});
  await atomicJSON(path.join(publicRoot,'active.json'),rollback,{mode:0o644});
  journal.phase='pending';delete journal.activation;delete journal.base;
 }
 async function receipt(journal,descriptor) {
  journal.phase='delivered';journal.receipt={operationId:journal.intent.operationId,operationSeq:journal.sequence,...descriptor};delete journal.error;
  await save(journal);return publicStatus(journal);
 }
 function publicStatus(journal) {return {operationId:journal.intent.operationId,target:journal.intent.target,operation:journal.intent.operation,status:journal.phase,...(journal.receipt?{receipt:journal.receipt}:{}),...(journal.error?{error:journal.error}:{})};}
 async function execute(input) {
  const intent=validateIntent(input);
  return serial(privateRoot,async()=>{
   await roots();
   let journal;
   try {journal=await readJSON(path.join(journalRoot,intent.operationId+'.json'));}
   catch(error) {if(error.code!=='ENOENT')throw error;}
   if(journal) {
    if(canonicalJSON(journal.intent)!==canonicalJSON(intent))throw new PublicationError('idempotency-conflict');
    if(journal.phase==='delivered')return publicStatus(journal);
    if(journal.phase==='superseded'||journal.phase==='conflict')throw new PublicationError(journal.phase);
   } else {
    // Sequence is durably consumed before the intent: gaps after crash are safe.
    let high=0;try {high=(await readJSON(path.join(privateRoot,'sequence.json'),4096)).sequence;}catch(error){if(error.code!=='ENOENT')throw error;}
    if(!Number.isSafeInteger(high)||high<0||high===Number.MAX_SAFE_INTEGER)throw new PublicationError('invalid-sequence');
    journal={version:1,intent,sequence:high+1,phase:'intent'};
    await atomicJSON(path.join(privateRoot,'sequence.json'),{sequence:journal.sequence});await save(journal);
   }
   let staging;
   try {
    const base=await active();
    if(journal.activation) {
     let confirmed;
     try {confirmed=validateActiveDescriptor(await readJSON(path.join(history,stateName(journal.activation)),4096));}
     catch(error) {if(error.code!=='ENOENT')throw error;}
     if(confirmed) {
      if(!sameDescriptor(confirmed,journal.activation))throw new PublicationError('invalid-activation-history');
      return await receipt(journal,journal.activation);
     }
    }
    // Receipt loss after CAS is resolved before any source check or native write.
    if(journal.activation&&sameDescriptor(base.descriptor,journal.activation)) {
     return await withActivationLock(privateRoot,async()=>{
      const observed=validateActiveDescriptor(await readJSON(path.join(publicRoot,'active.json'),4096));
      if(!sameDescriptor(observed,journal.activation))throw new PublicationError('base-conflict');
      try {await probe({kind:'active',descriptor:journal.activation});}
      catch(error) {if(error instanceof ReadinessRejected)await rejectActivation(journal);throw error;}
      await atomicJSON(path.join(history,stateName(journal.activation)),journal.activation);
      await atomicJSON(path.join(publicRoot,'activated',journal.activation.contentId+'.json'),journal.activation,{mode:0o644});
      return await receipt(journal,journal.activation);
     });
    }
    if((base.state.latest[intent.target]??0)>journal.sequence)throw new PublicationError('superseded');
    if(journal.phase==='committing') {
     // A later native public mutation of the same stable target makes commit
     // attribution ambiguous (particularly two deletes). Never resurrect it.
     for(const name of await listJSON(journalRoot)) {
      if(!/^[a-zA-Z0-9_-]{16,128}\.json$/.test(name))throw new PublicationError('invalid-journal');
      const later=await readJSON(path.join(journalRoot,name));
      if(later.sequence>journal.sequence&&later.intent.target===intent.target&&(later.committed||later.phase==='committing'))throw new PublicationError('superseded');
     }
     const recovery=await native.recover(journal);
     if(recovery.state==='committed') {journal.committed=recovery.result;journal.phase='committed';}
     else if(recovery.state==='uncommitted') {journal.phase='intent';}
     else throw new PublicationError('commit-uncertain');
     await save(journal);
    }
    let delta;
    if(journal.committed) {
     const current=await native.current(intent);
     if(canonicalJSON(current)!==canonicalJSON(journal.committed.current))throw new PublicationError('stale-revision');
     // The committed result contains only the target canonical delta; retries do
     // not re-read pending `_status=published` values of other native records.
     delta=await native.delivery(journal);
    } else {
     delta=await native.prepare(intent);
     if(delta.sourceDigest!==intent.sourceDigest)throw new PublicationError('source-conflict');
    }
    if(!['publish','restore'].includes(intent.operation)&&delta.project)throw new PublicationError('invalid-removal-delta');
    if(['publish','restore'].includes(intent.operation)&&!delta.project)throw new PublicationError('missing-publication-delta');
    const built=await build(base,delta,intent);
    await fault('staging',journal);staging=await stage(built.candidate,built.assets);
    if(!journal.committed) {
     journal.phase='committing';journal.source={sourceDigest:delta.sourceDigest,selectedRevision:delta.selectedRevision};await save(journal);
     await fault('before-native',journal);
     // Adapter owns short native transaction, exact source recheck and access.
     // A thrown commit is ambiguous; only recovery may establish what happened.
     journal.committed=await native.commit(intent,journal.source,async prepared=>{journal.nativePrepared=prepared;await save(journal);});journal.phase='committed';await save(journal);
     await fault('after-native',journal);
    }
    await promote(staging,built.candidate);await fault('candidate',journal);
    await probe({kind:'candidate',contentId:built.candidate.contentId,rendererId:renderer.rendererId});
    // Code releases take the same lock. Native queue remains serialized while
    // activation lock protects only the pointer/probe window.
    return await withActivationLock(privateRoot,async()=>{
     const now=await active();
     if(!sameDescriptor(now.descriptor,base.descriptor))throw new PublicationError('base-conflict');
     if((now.state.latest[intent.target]??0)>journal.sequence)throw new PublicationError('superseded');
     const descriptor=validateActiveDescriptor({contractVersion:DELIVERY_VERSION,contentId:built.candidate.contentId,rendererId:renderer.rendererId,activationSeq:now.descriptor.activationSeq+1});
     const state={descriptor,projects:built.map,latest:{...now.state.latest,[intent.target]:journal.sequence}};
     journal.base=base.descriptor;journal.activation=descriptor;journal.phase='activating';await save(journal);
     await atomicJSON(path.join(states,stateName(descriptor)),state);
     await probe({kind:'active',descriptor:base.descriptor});
     await atomicJSON(path.join(history,stateName(base.descriptor)),base.descriptor);
     // Mark A before switching, so requests captured on A survive a switch to B.
     await atomicJSON(path.join(publicRoot,'activated',base.descriptor.contentId+'.json'),base.descriptor,{mode:0o644});
     await fault('before-activation',journal);
     await atomicJSON(path.join(publicRoot,'active.json'),descriptor,{mode:0o644});
     await fault('after-activation',journal);
     try {await probe({kind:'active',descriptor});}
     catch(error) {
      if(error instanceof ReadinessRejected)await rejectActivation(journal);
      throw error;
     }
     await atomicJSON(path.join(history,stateName(descriptor)),descriptor);
     await atomicJSON(path.join(publicRoot,'activated',descriptor.contentId+'.json'),descriptor,{mode:0o644});
     return await receipt(journal,descriptor);
    });
   } catch(error) {
    if(journal.phase==='delivered')throw error;
    // Never conceal a possibly committed native write or activated pointer.
    // A later explicit retry verifies them; process start performs no delivery.
    journal.error=error instanceof PublicationError?error.code:'delivery-failed';
    if(['superseded','stale-revision','source-conflict'].includes(journal.error))journal.phase=journal.error==='superseded'?'superseded':'conflict';
    else if(!['committing','activating'].includes(journal.phase))journal.phase=journal.committed?'pending':'failed';
    await save(journal);return publicStatus(journal);
   } finally {if(staging)await rm(staging,{recursive:true,force:true});}
  });
 }
 async function status({actor,target}={}) {
  await roots();const result=[];
  for(const name of await listJSON(journalRoot)) {
   if(!/^[a-zA-Z0-9_-]{16,128}\.json$/.test(name))throw new PublicationError('invalid-journal');
   const journal=await readJSON(path.join(journalRoot,name));
   validateIntent(journal.intent);
   if((actor===undefined||journal.intent.actor===actor)&&(target===undefined||journal.intent.target===target))result.push({...publicStatus(journal),sequence:journal.sequence});
  }
  return result.sort((a,b)=>b.sequence-a.sequence);
 }
 // Initial projection is exclusively an explicit lifecycle operation. Caller
 // must supply proven baseline native-ID bindings; there is no automatic export.
 async function initialize({prepared,mapping}) {
  return serial(privateRoot,async()=>{
   await assertDirectory(publicRoot,{create:true,mode:0o755});await roots();
   return withActivationLock(privateRoot,async()=>{
    try {await readJSON(path.join(publicRoot,'active.json'));throw new PublicationError('already-initialized');}
    catch(error) {if(error.code!=='ENOENT')throw error;}
    const candidate=createDeliveryGeneration(prepared,renderer);
    const descriptor={contractVersion:DELIVERY_VERSION,contentId:candidate.contentId,rendererId:renderer.rendererId,activationSeq:0};
    const state=validateMap({descriptor,projects:mapping,latest:{}},descriptor,candidate);
    const staging=await stage(candidate,prepared.assets);
    try {await promote(staging,candidate);}finally{await rm(staging,{recursive:true,force:true});}
    await probe({kind:'candidate',contentId:candidate.contentId,rendererId:renderer.rendererId});
    await atomicJSON(path.join(states,stateName(descriptor)),state);
    await atomicJSON(path.join(publicRoot,'activated',candidate.contentId+'.json'),descriptor,{mode:0o644});
    await atomicJSON(path.join(publicRoot,'active.json'),descriptor,{mode:0o644});
    await probe({kind:'active',descriptor});await atomicJSON(path.join(history,stateName(descriptor)),descriptor);return descriptor;
   });
  });
 }
 return {execute,status,initialize,active};
}
