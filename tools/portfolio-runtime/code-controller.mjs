import path from 'node:path';
import {canonicalJSON,exactObject,contentHash} from '../portfolio-delivery/contract.mjs';
import {readJSON,atomicJSON,withActivationLock} from '../portfolio-delivery/durable-store.mjs';
import {createGenerationReader} from '../portfolio-delivery/reader.mjs';
import {validatePortfolioRelease} from './active-release.mjs';import {verifyPortfolioArtifact} from './artifact.mjs';
import {validateCMSRelease,verifyCMSRelease} from './cms-release.mjs';
import {initialCodeState,validateCodeState,isConfirmedCode} from './code-state.mjs';
import {schemaHash} from '../payload-admin/scripts/schema.mjs';
const equal=(a,b)=>canonicalJSON(a)===canonicalJSON(b),operationPattern=/^[a-zA-Z0-9_-]{16,128}$/;
export function createCodeController({privateRoot,dataRoot,publicRoot,files,adapters,fixture=false,fault=async()=>{}}){
 for(const root of [privateRoot,dataRoot,publicRoot,files?.portfolio,files?.cms])if(typeof root!=='string'||!path.isAbsolute(root)||path.resolve(root)!==root||root==='/')throw new Error('Explicit absolute code controller paths required');
 if(privateRoot!==path.join(dataRoot,'delivery')||publicRoot===dataRoot||publicRoot.startsWith(dataRoot+path.sep)||dataRoot.startsWith(publicRoot+path.sep))throw new Error('Code journals must share the private publication lock and stay outside public content');
 const validators={portfolio:validatePortfolioRelease,cms:validateCMSRelease};
 const journalRoot=path.join(privateRoot,'code-operations');
 const slot=(app,value)=>validateCodeState({version:1,app,confirmed:value,selected:value},app,validators[app]).confirmed;
 function intent(value){
  exactObject(value,['version','operationId','app','expected','target','aborts'],'Code intent');
  if(value.version!==1||typeof value.operationId!=='string'||!operationPattern.test(value.operationId)||!Object.hasOwn(validators,value.app)||(value.aborts!==null&&(typeof value.aborts!=='string'||!operationPattern.test(value.aborts))))throw new Error('Invalid code intent');
  return {...value,expected:slot(value.app,value.expected),target:validators[value.app](value.target)};
 }
 async function state(app){
  const active=validators[app](await readJSON(files[app],16384));let result;
  try{result=validateCodeState(await readJSON(files[app]+'.state.json',65536),app,validators[app]);}
  catch(error){if(error.code!=='ENOENT')throw error;result=initialCodeState(app,active,validators[app]);}
  if(!equal(active,result.confirmed.release)&&!equal(active,result.selected.release))throw new Error('code-conflict');
  return result;
 }
 async function verify(app,release){
  if(app==='cms')return verifyCMSRelease(release,{fixture});
  const manifest=await verifyPortfolioArtifact(release.artifactRoot);
  if((!fixture&&manifest.sourceDirty)||!equal(manifest.portfolioBuildId,release.portfolioBuildId)||!equal(manifest.renderer,release.renderer))throw new Error('Portfolio code artifact differs');
  return release;
 }
 async function compatible(app,release){
  await verify(app,release);
  let renderer;
  if(app==='portfolio'){
   renderer=release.renderer;
   const cms=await verifyCMSRelease(await readJSON(files.cms,16384),{fixture});
   if(!cms.producer.contractVersions.includes(renderer.contractVersion))throw new Error('CMS producer/public contract mismatch');
  }else{
   const current=await state('portfolio');if(!isConfirmedCode(current))throw new Error('code-conflict');
   await verify('portfolio',current.confirmed.release);renderer={...current.confirmed.release.renderer,capabilities:release.producer.capabilities};
   if(!release.producer.contractVersions.includes(renderer.contractVersion)||await schemaHash(dataRoot,{contractRoot:path.join(release.artifactRoot,'tools/payload-admin')})!==release.schemaHash)throw new Error('CMS schema/producer compatibility rejected');
  }
  return (await createGenerationReader({root:publicRoot,renderer}).readActive({allowLastGood:false})).descriptor;
 }
 const identity=(app,value)=>app==='portfolio'?{portfolioBuildId:value.release.portfolioBuildId,rendererId:value.release.renderer.rendererId,codeActivationSeq:value.activationSeq}:{cmsBuildId:value.release.cmsBuildId,codeActivationSeq:value.activationSeq};
 const matches=(app,actual,value)=>actual&&Object.entries(identity(app,value)).every(([key,expected])=>equal(actual[key]??null,expected));
 async function observe(app,allowed){
  const actual=await adapters[app].read();
  if(!actual||!['ready','starting','stopped'].includes(actual.status))throw new Error('Code process identity is uncertain');
  if(actual.status!=='stopped'&&!allowed.some(value=>matches(app,actual.identity,value)))throw new Error('code-conflict');
  return actual;
 }
 function ready(app,actual,target,content){
  if(actual.status!=='ready'||!matches(app,actual.identity,target))throw new Error('Code readiness not confirmed');
  if(app==='portfolio'){
   if(actual.identity.contentId!==content.contentId||actual.identity.activationSeq!==content.activationSeq)throw new Error('Code/content readiness differs');
  }else if(actual.identity.schemaHash!==target.release.schemaHash||!equal(actual.identity.producer,target.release.producer)||actual.identity.writerConfirmed!==true)throw new Error('CMS readiness differs');
 }
 async function journal(id){
  try{const value=await readJSON(path.join(journalRoot,id+'.json'),131072);exactObject(value,['version','intent','target','previous','phase','supersededBy','confirmation','receipt'],'Code journal');
   const request=intent(value.intent);if(value.version!==1||request.operationId!==id||!['prepared','confirming','complete','superseded'].includes(value.phase)||value.supersededBy!==null&&!operationPattern.test(value.supersededBy))throw new Error('Invalid code journal');
   const target=slot(request.app,value.target),previous=slot(request.app,value.previous);if(target.operationId!==id||!equal(target.release,request.target)||target.activationSeq<=previous.activationSeq||target.activationSeq<=request.expected.activationSeq)throw new Error('Invalid code journal sequence');
   if(value.confirmation!==null){exactObject(value.confirmation,['contentId','activationSeq'],'Code confirmation');if(!/^[a-f0-9]{64}$/.test(value.confirmation.contentId)||!Number.isSafeInteger(value.confirmation.activationSeq)||value.confirmation.activationSeq<0)throw new Error('Invalid code confirmation');}
   if(['confirming','complete'].includes(value.phase)&&value.confirmation===null)throw new Error('Missing code confirmation');
   if(value.phase==='complete'){
    exactObject(value.receipt,['version','operationId','app','slot','content'],'Code receipt');exactObject(value.receipt.content,['contentId','activationSeq'],'Code receipt content');
    if(value.receipt.version!==1||value.receipt.operationId!==id||value.receipt.app!==request.app||!equal(value.receipt.slot,target)||!/^[a-f0-9]{64}$/.test(value.receipt.content.contentId)||!Number.isSafeInteger(value.receipt.content.activationSeq)||value.receipt.content.activationSeq<0||value.supersededBy!==null||!equal(value.receipt.content,value.confirmation))throw new Error('Invalid completed code receipt');
   }else if(value.receipt!==null)throw new Error('Unconfirmed code receipt');
   return {...value,intent:request,target,previous};
  }catch(error){if(error.code==='ENOENT')return null;throw error;}
 }
 const save=value=>atomicJSON(path.join(journalRoot,value.intent.operationId+'.json'),value);
 async function complete(operation){
  operation.phase='complete';operation.receipt={version:1,operationId:operation.intent.operationId,app:operation.intent.app,slot:operation.target,content:operation.confirmation};await save(operation);return operation.receipt;
 }
 async function reconcileConfirmed(app,current){
  if(current.confirmed.operationId===null)return;
  const previous=await journal(current.confirmed.operationId);
  if(!previous||previous.intent.app!==app||!equal(previous.target,current.confirmed)||!['confirming','complete'].includes(previous.phase))throw new Error('Confirmed code journal is missing');
  // Before any newer selection consumes this confirmed slot, finish its receipt.
  // A disk error here blocks advancement, so later retries cannot lose history.
  if(previous.phase==='confirming')await complete(previous);
 }
 async function retain(app,release){await atomicJSON(path.join(privateRoot,'retained-code',app,contentHash(canonicalJSON(release))+'.json'),release);}
 async function allocate(current){
  let previous=0;try{const value=await readJSON(path.join(privateRoot,'code-highwater.json'),1024);exactObject(value,['version','activationSeq'],'Code highwater');if(value.version!==1||!Number.isSafeInteger(value.activationSeq)||value.activationSeq<0)throw new Error('Invalid code highwater');previous=value.activationSeq;}catch(error){if(error.code!=='ENOENT')throw error;}
  const next=Math.max(previous,current.confirmed.activationSeq,current.selected.activationSeq)+1;if(!Number.isSafeInteger(next))throw new Error('Code activation sequence exhausted');
  await atomicJSON(path.join(privateRoot,'code-highwater.json'),{version:1,activationSeq:next});return next;
 }
 async function apply(raw){
  const request=intent(raw);
  return withActivationLock(privateRoot,async()=>{
   let operation=await journal(request.operationId);
   if(operation&&!equal(operation.intent,request))throw new Error('Code operation ID reused');
   if(operation?.phase==='complete')return operation.receipt;
   if(operation?.phase==='superseded')throw new Error('Code operation superseded');
   let current=await state(request.app);await reconcileConfirmed(request.app,current);
   operation=await journal(request.operationId);if(operation?.phase==='complete')return operation.receipt;
   if(!operation){
    if(!equal(current.confirmed,request.expected))throw new Error('code-conflict');
    if(request.aborts===null){if(!isConfirmedCode(current))throw new Error('code-conflict');}
    else{
     const aborted=await journal(request.aborts);
     if(isConfirmedCode(current)||current.selected.operationId!==request.aborts||!aborted||!['prepared','confirming'].includes(aborted.phase)||aborted.intent.app!==request.app||!equal(aborted.target,current.selected)||!equal(request.target,request.expected.release))throw new Error('Code abort conflict');
    }
    await compatible(request.app,request.target);await observe(request.app,[current.confirmed,current.selected]);
    const target={activationSeq:await allocate(current),operationId:request.operationId,release:request.target};
    operation={version:1,intent:request,target,previous:current.selected,phase:'prepared',supersededBy:null,confirmation:null,receipt:null};await save(operation);
   }
   const target=operation.target;
   const alreadyConfirmed=equal(current.confirmed,target)&&equal(current.selected,target);
   if(!alreadyConfirmed&&(!equal(current.confirmed,request.expected)||(!equal(current.selected,operation.previous)&&!equal(current.selected,target))))throw new Error('code-conflict');
   // Every retry/rollback verifies the current generation, never a saved older one.
   let content=await compatible(request.app,request.target);
   await observe(request.app,[request.expected,operation.previous,target]);
   await retain(request.app,request.expected.release);await retain(request.app,operation.previous.release);await retain(request.app,request.target);
   if(request.aborts!==null){const aborted=await journal(request.aborts);if(!aborted||aborted.phase==='complete'||aborted.supersededBy!==null&&aborted.supersededBy!==request.operationId)throw new Error('Code abort conflict');aborted.phase='superseded';aborted.supersededBy=request.operationId;await save(aborted);}
   if(!alreadyConfirmed){current={...current,selected:target};await atomicJSON(files[request.app]+'.state.json',current);}
   let actual=await observe(request.app,[request.expected,operation.previous,target]);
   if(!matches(request.app,actual.identity,target)||actual.status!=='ready'){
    // Lifecycle adapters affect only their exact managed application. No data,
    // content pointer or other process rollback occurs on startup/probe failure.
    await adapters[request.app].reload({target,previous:operation.previous});
    actual=await observe(request.app,[target]);
   }
   content=await compatible(request.app,request.target);ready(request.app,actual,target,content);
   operation.phase='confirming';operation.confirmation={contentId:content.contentId,activationSeq:content.activationSeq};await save(operation);
   await atomicJSON(files[request.app],target.release);
   await atomicJSON(files[request.app]+'.state.json',{version:1,app:request.app,confirmed:target,selected:target});
   await fault('after-code-confirmation');return complete(operation);
  });
 }
 return {apply,state};
}
