import {mkdtemp,readFile,realpath,rm,writeFile,mkdir,rename,readdir} from 'node:fs/promises';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomBytes,randomUUID} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {cmsSourceHash} from './source-hash.mjs';
const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Build/generate operate with an isolated synthetic configuration. They neither
// acquire the live CMS writer lock nor read a real database/authentication secret.
export async function buildCMS({mode='build'}={}) {
 if(!['build','generate'].includes(mode))throw new Error('Invalid CMS code command');
 if((await readdir(appRoot)).some(name=>name==='.env'||name.startsWith('.env.')))throw new Error('CMS code build cannot load source environment files; use external runtime configuration');
 const buildId=randomUUID(),buildDir='.cms-builds/'+buildId,tsconfigFile='.cms-build-'+buildId+'.tsconfig.json'
 await mkdir(path.join(appRoot,buildDir),{recursive:true})
 const tsconfig=JSON.parse(await readFile(path.join(appRoot,'tsconfig.json'),'utf8'));
 tsconfig.include=[...tsconfig.include.filter(name=>!name.startsWith('.next/')),buildDir+'/types/**/*.ts',buildDir+'/dev/types/**/*.ts'];
 await writeFile(path.join(appRoot,tsconfigFile),JSON.stringify(tsconfig),{flag:'wx'});
 const git=promisify(execFile),repoRoot=path.resolve(appRoot,'../..');
 const {stdout:sourceSha}=await git('git',['rev-parse','HEAD'],{cwd:repoRoot});
 const {stdout:sourceStatus}=await git('git',['status','--porcelain','--untracked-files=normal','--','.',':!USERSPACE'],{cwd:repoRoot});
 const source=await cmsSourceHash(),root=await mkdtemp(path.join(await realpath(os.tmpdir()),'des-art-payload-test-build-'));
 try {
  const env={PATH:process.env.PATH,TMPDIR:path.dirname(root),NODE_ENV:'production',PAYLOAD_CODE_BUILD_DIR:buildDir,PAYLOAD_CODE_TSCONFIG:tsconfigFile,PAYLOAD_RUNTIME_MODE:'fixture',PAYLOAD_LOCAL_ROOT:root,PAYLOAD_SECRET:randomBytes(48).toString('hex'),PAYLOAD_TELEMETRY_DISABLED:'1',NEXT_TELEMETRY_DISABLED:'1'};
  const commands=mode==='build'?[['node_modules/next/dist/bin/next','build']]:[['--import','tsx','node_modules/payload/bin.js','--disable-transpile','generate:importmap'],['--import','tsx','node_modules/payload/bin.js','--disable-transpile','generate:types']];
  for(const args of commands) {
   const child=spawn(process.execPath,args,{cwd:appRoot,env,stdio:'inherit'}),stop=()=>child.kill('SIGTERM');
   process.once('SIGTERM',stop);process.once('SIGINT',stop);
   let code;try{code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',value=>resolve(value??1));});}finally{process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);}
   if(code!==0)throw new Error(`CMS ${mode} failed (${code})`);
  }
  if(mode==='build') {
   if(await cmsSourceHash()!==source)throw new Error('CMS code changed during build');
   await writeFile(path.join(appRoot,buildDir,'local-source-hash'),source);
   await writeFile(path.join(appRoot,buildDir,'build-identity.json'),JSON.stringify({sourceSha:sourceSha.trim(),sourceDirty:Boolean(sourceStatus.trim()),sourceHash:source}));
   const temporary=path.join(appRoot,'.cms-builds','candidate-'+randomUUID()+'.json');
   await writeFile(temporary,JSON.stringify({version:1,buildDir,sourceHash:source}));
   await rename(temporary,path.join(appRoot,'.cms-builds/candidate.json'));
   console.log('Built independent CMS candidate '+buildDir);
  }
 }finally{await rm(root,{recursive:true,force:true});await rm(path.join(appRoot,tsconfigFile),{force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))buildCMS({mode:process.argv[2]??'build'}).catch(error=>{console.error(error.message);process.exitCode=1;});
