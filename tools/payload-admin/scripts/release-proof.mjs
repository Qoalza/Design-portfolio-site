import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import {randomBytes} from 'node:crypto';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const appRoot=fileURLToPath(new URL('..',import.meta.url));
const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-test-release-'));
const secret=randomBytes(48).toString('hex');
await writeFile(path.join(root,'secret'),secret,{mode:0o600});
const env={...process.env,PAYLOAD_LOCAL_ROOT:root,PAYLOAD_SECRET:secret,PAYLOAD_TEST_PUSH:'',PAYLOAD_TELEMETRY_DISABLED:'1'};
try{
 for(const args of [['--import','tsx','scripts/migrate-worker.ts'],['--import','tsx','tests/release-proof.ts','seed'],['--import','tsx','tests/release-proof.ts','reopen']]){
  const child=spawn(process.execPath,args,{cwd:appRoot,env,stdio:'inherit'});
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve)});
  if(code)throw new Error('Disposable release proof failed');
 }
 const render=spawn(process.execPath,['--experimental-strip-types','tests/payload-release-renderer.test.mjs'],{cwd:path.resolve(appRoot,'../..'),env:{...process.env,PORTFOLIO_PROJECT_SNAPSHOT:path.join(root,'exports/changed')},stdio:'inherit'});
 const renderCode=await new Promise((resolve,reject)=>{render.once('error',reject);render.once('exit',resolve)});if(renderCode)throw new Error('Payload renderer proof failed');
 if(process.argv.includes('--keep')){
  await writeFile('/private/tmp/payload-redesign-proof-root-20261005.txt',root);
  console.log('Proof snapshot root:',path.join(root,'exports/changed'));
 }else await rm(root,{recursive:true,force:true});await rm(root+'-backups',{recursive:true,force:true});
}catch(error){await rm(root,{recursive:true,force:true});await rm(root+'-backups',{recursive:true,force:true});throw error;}
