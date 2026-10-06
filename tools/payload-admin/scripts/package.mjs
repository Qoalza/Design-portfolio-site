import {mkdir,readFile,writeFile,cp,rm,realpath,link} from 'node:fs/promises';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';import {fileURLToPath} from 'node:url';import {build as bundle} from 'esbuild';
import {cmsSourceHash} from './source-hash.mjs';import {cmsArtifactFiles,verifyCMSArtifact,producer,runtimePlatform,hash,canonical} from './artifact.mjs';
const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repoRoot=path.resolve(appRoot,'../..'),exec=promisify(execFile);
export async function packageCMS({fixture=false,root,archive}={}){
 const candidate=JSON.parse(await readFile(path.join(appRoot,'.cms-builds/candidate.json'),'utf8'));
 if(candidate.version!==1||!/^\.cms-builds\/[a-f0-9-]{36}$/.test(candidate.buildDir))throw new Error('Invalid CMS build candidate');
 const buildRoot=path.join(appRoot,candidate.buildDir),identity=JSON.parse(await readFile(path.join(buildRoot,'build-identity.json'),'utf8'));
 const {stdout:head}=await exec('git',['rev-parse','HEAD'],{cwd:repoRoot});const {stdout:dirty}=await exec('git',['status','--porcelain','--untracked-files=normal','--','.',':!USERSPACE'],{cwd:repoRoot});
 if(identity.sourceHash!==candidate.sourceHash||identity.sourceHash!==await cmsSourceHash()||identity.sourceSha!==head.trim())throw new Error('CMS packaging requires exact current build');
 if(!fixture&&(identity.sourceDirty||dirty.trim()||process.platform!=='linux'))throw new Error('CMS release requires clean exact HEAD and Linux native build');
 const temporary=path.resolve(await realpath(os.tmpdir()));
 root=path.resolve(root??path.join(appRoot,'.cms-release',fixture?'fixture-'+path.basename(candidate.buildDir):identity.sourceSha));
 if(!root.startsWith(path.join(appRoot,'.cms-release')+path.sep)&&!(path.dirname(root).startsWith(temporary+path.sep)&&path.basename(path.dirname(root)).startsWith('des-art-payload-test-')))throw new Error('CMS package output must be generated or disposable');
 await mkdir(path.dirname(root),{recursive:true});await mkdir(root,{mode:0o755});
 try{
  await cp(path.join(buildRoot,'standalone'),root,{recursive:true,verbatimSymlinks:true,errorOnExist:true,force:false});
  const targetApp=path.join(root,'tools/payload-admin'),targetScripts=path.join(targetApp,'scripts');await mkdir(targetScripts,{recursive:true});
  await cp(path.join(buildRoot,'static'),path.join(targetApp,candidate.buildDir,'static'),{recursive:true,verbatimSymlinks:true});
  await cp(path.join(appRoot,'public'),path.join(targetApp,'public'),{recursive:true,verbatimSymlinks:true});
  await cp(path.join(appRoot,'scripts/schema-history.json'),path.join(targetScripts,'schema-history.json'));
  await cp(path.join(appRoot,'scripts/writer-child.mjs'),path.join(targetScripts,'writer-child.mjs'));
  await bundle({entryPoints:[path.join(appRoot,'scripts/artifact-start.mjs')],outfile:path.join(targetScripts,'artifact-start.mjs'),bundle:true,platform:'node',format:'esm',target:'node22',packages:'bundle',sourcemap:false});
  await bundle({entryPoints:[path.join(appRoot,'scripts/active-start.mjs')],outfile:path.join(targetScripts,'active-start.mjs'),bundle:true,platform:'node',format:'esm',target:'node22',packages:'bundle',sourcemap:false});
  // Next standalone server.js is CommonJS even when the source app uses ESM.
  await writeFile(path.join(root,'package.json'),JSON.stringify({private:true,type:'commonjs'}));
  const schema=JSON.parse(await readFile(path.join(targetScripts,'schema-history.json'),'utf8'));
  const body={version:1,sourceHash:identity.sourceHash,sourceDirty:identity.sourceDirty||Boolean(dirty.trim()),runtime:runtimePlatform(),schemaHash:schema.current,producer,buildDir:candidate.buildDir,files:await cmsArtifactFiles(root)};
  const manifest={...body,cmsBuildId:{sourceSha:identity.sourceSha,artifactSha256:hash(canonical(body))}};
  await writeFile(path.join(root,'cms-release-manifest.json'),canonical(manifest));await verifyCMSArtifact(root,{fixture});
  archive=path.resolve(archive??root+'.tar.gz');
  if(path.dirname(archive)!==path.dirname(root))throw new Error('CMS archive must stay beside package output');
  const temporaryArchive=archive+'.'+randomUUID()+'.partial';
  try{
   await exec('tar',[...(process.platform==='darwin'?['--no-mac-metadata','--no-xattrs','--no-acls','--no-fflags']:[]),'-czf',temporaryArchive,'-C',root,'.'],{env:{PATH:process.env.PATH,COPYFILE_DISABLE:'1'}});
   await link(temporaryArchive,archive);
  }finally{await rm(temporaryArchive,{force:true});}
  const bytes=await readFile(archive);return {cmsBuildId:manifest.cmsBuildId,runtime:manifest.runtime,productionEligible:!fixture,root,archive,sha256:hash(bytes),size:bytes.length};
 }catch(error){await rm(root,{recursive:true,force:true});throw error;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))packageCMS({fixture:process.argv.slice(2).includes('--fixture')}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
