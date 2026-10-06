import assert from 'node:assert/strict';import {mkdtemp,rm,readFile,cp,writeFile} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {fileURLToPath,pathToFileURL} from 'node:url';import {spawn} from 'node:child_process';import {createServer} from 'node:net';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!process.argv.includes('--session')){
 const {realpath}=await import('node:fs/promises');
 const child=spawn(process.execPath,['--experimental-strip-types',fileURLToPath(import.meta.url),'--session'],{env:{PATH:process.env.PATH,TMPDIR:await realpath(os.tmpdir())},stdio:'inherit'});
 const stop=()=>child.kill('SIGTERM');process.once('SIGINT',stop);process.once('SIGTERM',stop);
 process.exitCode=await new Promise((resolve,reject)=>{child.once('exit',code=>resolve(code??1));child.once('error',reject);});
 process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
}else{
const temporary=os.tmpdir();
const {packageCMS}=await import(repo+'/tools/payload-admin/scripts/package.mjs');const {prepare}=await import(repo+'/tools/payload-admin/scripts/database.mjs');const {locations,acquire}=await import(repo+'/tools/payload-admin/scripts/state.mjs');
const {createPublicationCoordinator}=await import(repo+'/tools/portfolio-delivery/coordinator.mjs');const {createLoopbackProbe}=await import(repo+'/tools/portfolio-delivery/probe.mjs');
const parent=await mkdtemp(path.join(temporary,'des-art-payload-test-package-proof-')),data=await mkdtemp(path.join(temporary,'des-art-payload-test-cms-package-')),state=locations(data);
let root=path.join(parent,'cms-release');const publicCode=path.join(parent,'public-code'),publicRoot=path.join(parent,'public'),codeFile=path.join(parent,'public-code.json'),cmsCodeFile=path.join(parent,'cms-code.json'),portServer=createServer();
await new Promise(resolve=>portServer.listen(0,'127.0.0.1',resolve));const publicPort=portServer.address().port;await new Promise(resolve=>portServer.close(resolve));const publicOrigin='http://127.0.0.1:'+publicPort;
let cms,site,cmsEnd,siteEnd,stopped=false;
const stop=()=>{stopped=true;cms?.kill('SIGTERM');site?.kill('SIGTERM');};process.once('SIGINT',stop);process.once('SIGTERM',stop);
function checkStop(){if(stopped)throw new Error('Fixture stopped');}
function child(entry,env){checkStop();const processChild=spawn(process.execPath,[entry],{cwd:parent,env,stdio:['ignore','pipe','pipe']});let text='';processChild.stdout.on('data',b=>{text=(text+b).slice(-16000);});processChild.stderr.on('data',b=>{text=(text+b).slice(-16000);});const end=new Promise((resolve,reject)=>{processChild.once('exit',resolve);processChild.once('error',reject);});return {process:processChild,end,logs:()=>text};}
async function ready(origin,url,processChild,readLogs){let last="";for(let i=0;i<200;i++){if(processChild.exitCode!==null)throw new Error('Artifact exited '+readLogs());try{const response=await fetch(origin+url,{signal:AbortSignal.timeout(1000)});if(response.status===200)return response;if(url.includes("cms-health"))last=response.status+" "+await response.text();}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('Artifact readiness timeout '+last+' '+readLogs());}
const start=()=>{const result=child(path.join(root,'tools/payload-admin/scripts/active-start.mjs'),{PAYLOAD_ACTIVE_RELEASE:cmsCodeFile,NODE_ENV:'production',TMPDIR:temporary,PAYLOAD_RUNTIME_MODE:'fixture',PAYLOAD_LOCAL_ROOT:data,PORTFOLIO_CONTENT_ROOT:publicRoot,PORTFOLIO_ACTIVE_RELEASE:codeFile,PORTFOLIO_INTERNAL_ORIGIN:publicOrigin});cms=result.process;cmsEnd=result.end;return result;};
async function stopCMS(){if(cms&&cms.exitCode===null){cms.kill('SIGTERM');await cmsEnd;}}
try{
 const packed=await packageCMS({fixture:true,root});
 const {mkdir}=await import('node:fs/promises');const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');
 root=path.join(parent,'unpacked');await mkdir(root);await promisify(execFile)('tar',['-xzpf',packed.archive,'-C',root]);
 const {verifyCMSArtifact}=await import(repo+'/tools/payload-admin/scripts/artifact.mjs');assert.deepEqual((await verifyCMSArtifact(root,{fixture:true})).cmsBuildId,packed.cmsBuildId);
 const cmsManifest=await verifyCMSArtifact(root,{fixture:true});const cmsRelease={version:1,artifactRoot:root,cmsBuildId:cmsManifest.cmsBuildId,schemaHash:cmsManifest.schemaHash,producer:cmsManifest.producer,runtime:cmsManifest.runtime};await writeFile(cmsCodeFile,JSON.stringify(cmsRelease));
 console.log('Packed fixture '+JSON.stringify({cmsBuildId:packed.cmsBuildId,runtime:packed.runtime,productionEligible:packed.productionEligible,size:packed.size}));
 checkStop();const lock=await acquire(state);try{await prepare(state);}finally{await lock.release();}
 const secret=await readFile(path.join(data,'secret'),'utf8');
 await cp(path.join(repo,'.portfolio-release/portfolio'),publicCode,{recursive:true});const publicManifest=JSON.parse(await readFile(path.join(publicCode,'release-manifest.json'),'utf8'));
 await writeFile(codeFile,JSON.stringify({version:1,artifactRoot:publicCode,portfolioBuildId:publicManifest.portfolioBuildId,renderer:publicManifest.renderer}));
 const publicLauncher=path.join(parent,'public-fixture-launcher.mjs');await writeFile(publicLauncher,`import {startActivePortfolio} from ${JSON.stringify(pathToFileURL(path.join(publicCode,'ops/active-start.mjs')).href)};await startActivePortfolio({fixture:true});`);
 const publicProcess=child(publicLauncher,{PORTFOLIO_ACTIVE_RELEASE:codeFile,PORTFOLIO_CONTENT_ROOT:publicRoot,PORTFOLIO_PORT:String(publicPort)});site=publicProcess.process;siteEnd=publicProcess.end;
 for(let i=0;i<200&&!publicProcess.logs().includes('Portfolio started on loopback');i++){checkStop();if(site.exitCode!==null)throw new Error('Public fixture exited '+publicProcess.logs());await new Promise(resolve=>setTimeout(resolve,100));}
 assert.ok(publicProcess.logs().includes('Portfolio started on loopback'),'own public process acquired its port');
 const coordinator=createPublicationCoordinator({publicRoot,privateRoot:path.join(data,'delivery'),renderer:publicManifest.renderer,native:{},probe:createLoopbackProbe(publicOrigin,{portfolioBuildId:publicManifest.portfolioBuildId})});
 await coordinator.initialize({prepared:{projects:[],assets:[],externalDependencies:[]},mapping:[]});
 const contentBefore=await readFile(path.join(publicRoot,'active.json'),'utf8');const launched=start();await ready(state.origin,'/admin/login',cms,launched.logs);
 const health=await ready(state.origin,'/api/internal/cms-health',cms,launched.logs);const initialHealth=await health.json();assert.equal(initialHealth.writerConfirmed,true);assert.equal(initialHealth.codeActivationSeq,0);
 const account={email:'artifact@example.test',password:'Fixture-password-'+Date.now()};let response=await fetch(state.origin+'/api/users/first-register',{method:'POST',headers:{'Content-Type':'application/json',Origin:state.origin},body:JSON.stringify(account)});assert.equal(response.status,200,await response.text());
 response=await fetch(state.origin+'/api/users/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:state.origin},body:JSON.stringify(account)});assert.equal(response.status,200);const {token}=await response.json();
 response=await fetch(state.origin+'/api/projects?draft=true',{method:'POST',headers:{Authorization:'JWT '+token,'Content-Type':'application/json',Origin:state.origin},body:JSON.stringify({title:'Artifact independent saved draft'})});assert.equal(response.status,201,await response.clone().text());const saved=await response.json();
 const ownerBefore=JSON.parse(await readFile(path.join(state.lock,'owner.json'),'utf8'));const cmsPID=cms.pid,publicPID=site.pid;
 const {atomicJSON}=await import(repo+'/tools/portfolio-delivery/durable-store.mjs');const {initialCodeState}=await import(repo+'/tools/portfolio-runtime/code-state.mjs');const {validateCMSRelease}=await import(repo+'/tools/portfolio-runtime/cms-release.mjs');const codeState=initialCodeState('cms',cmsRelease,validateCMSRelease);codeState.selected={activationSeq:1,operationId:'fixture_code_reload_0001',release:cmsRelease};await atomicJSON(cmsCodeFile+'.state.json',codeState);cms.kill('SIGUSR2');
 let reloaded=false;for(let i=0;i<200;i++){checkStop();if(cms.exitCode!==null)throw new Error('CMS reload exited '+launched.logs());try{const current=await fetch(state.origin+'/api/internal/cms-health',{signal:AbortSignal.timeout(1000)});if(current.ok&&(await current.json()).codeActivationSeq===1){reloaded=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert.ok(reloaded,launched.logs());
 const ownerAfter=JSON.parse(await readFile(path.join(state.lock,'owner.json'),'utf8'));assert.equal(cms.pid,cmsPID);assert.equal(site.pid,publicPID);assert.equal(ownerAfter.token,ownerBefore.token);assert.equal(ownerAfter.pid,ownerBefore.pid);assert.notEqual(ownerAfter.childPID,ownerBefore.childPID);assert.throws(()=>process.kill(ownerBefore.childPID,0),{code:'ESRCH'});
 codeState.confirmed=codeState.selected;await atomicJSON(cmsCodeFile+'.state.json',codeState);
 await stopCMS();const restarted=start();await ready(state.origin,'/api/internal/cms-health',cms,restarted.logs);
 response=await fetch(state.origin+'/api/projects/'+saved.doc.id+'?draft=true',{headers:{Authorization:'JWT '+token}});assert.equal(response.status,200);assert.equal((await response.json()).title,'Artifact independent saved draft');
 assert.equal(await readFile(path.join(data,'secret'),'utf8'),secret);assert.equal(await readFile(path.join(publicRoot,'active.json'),'utf8'),contentBefore);
 console.log('PASS: standalone packaged two processes with no Git/source tooling, schema/writer health, authenticated saved draft, stable CMS reload ownership/epoch and restart/session/data/content preservation');
}finally{
 await stopCMS();if(site&&site.exitCode===null){site.kill('SIGTERM');await siteEnd;}
 process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
 for(const file of [parent,data,state.backups,state.lock,state.journal,state.lock+'.maintenance.db',state.lock+'.maintenance.db-journal'])await rm(file,{recursive:true,force:true});
}

}
