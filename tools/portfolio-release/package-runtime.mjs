import {verifyNextBuild} from './build-stamp.mjs';
import {cp,readFile,writeFile,lstat,readdir,mkdir,mkdtemp,rm,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
const exec=promisify(execFile);
const forbidden=/^(?:public|tools|src|docs|USERSPACE|tests)(?:\/|$)|(^|\/)\.(?:git|local|env)(?:\/|\.|$)|\.(?:node|dylib|so|map|nft\.json)$/;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function entries(root,dir=root){const list=[];for(const entry of await readdir(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name),name=path.relative(root,absolute).split(path.sep).join('/');if(entry.isSymbolicLink())throw new Error('Runtime symlink: '+name);if(entry.isDirectory())list.push(...await entries(root,absolute));else if(entry.isFile()){const bytes=await readFile(absolute);list.push({path:name,bytes:bytes.length,sha256:hash(bytes)});}else throw new Error('Unsupported runtime entry');}return list.sort((a,b)=>a.path.localeCompare(b.path));}
export async function createRuntimeReleaseArchive({sourceRoot,archive,sha,expectedContentHash}){
 const {stdout:head}=await exec('git',['rev-parse','HEAD'],{cwd:sourceRoot});const {stdout:status}=await exec('git',['status','--porcelain','--untracked-files=normal','--','.',':!USERSPACE'],{cwd:sourceRoot});
 if(!/^[a-f0-9]{40}$/.test(sha)||sha!==head.trim()||status.trim())throw new Error('Release packaging requires exact clean Git HEAD');
 await verifyNextBuild(sourceRoot,sha);
 const site=JSON.parse(await readFile(path.join(sourceRoot,'.portfolio-release/site/site-manifest.json'),'utf8'));
 if(site.buildSha!==sha||site.sourceDirty||!['approved-git-code','payload-published'].includes(site.provenance?.origin))throw new Error('Build is stale, dirty or uses unknown content');
 if(site.provenance.origin==='payload-published'&&(!expectedContentHash||expectedContentHash!==site.snapshotSha256))throw new Error('Packaging requires exact selected CMS content digest');
 if(expectedContentHash&&expectedContentHash!==site.snapshotSha256)throw new Error('Cross-snapshot packaging rejected');
 const temporary=await mkdtemp(path.join(os.tmpdir(),'art-des-runtime-release-'));const release=path.join(temporary,'release');
 try{
  await mkdir(release);await cp(path.join(sourceRoot,'.next/standalone'),release,{recursive:true,force:true});await cp(path.join(sourceRoot,'.next/static'),path.join(release,'.next/static'),{recursive:true});
  // Next traces its optional optimizer/native build dependencies even when unoptimized.
  // This host uses only prebuilt images: ship a platform-neutral Node runtime.
  for(const name of ['node_modules/@img','node_modules/sharp'])await rm(path.join(release,name),{recursive:true,force:true});
  async function prune(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name),relative=path.relative(release,absolute).split(path.sep).join('/');if(forbidden.test(relative)){await rm(absolute,{recursive:true,force:true});continue;}if(entry.isDirectory())await prune(absolute);}}
  await prune(release);
  let server=await readFile(path.join(release,'server.js'),'utf8');const match=server.match(/^const nextConfig = (\{.*\})$/m);if(!match)throw new Error('Unexpected standalone entrypoint');const config=JSON.parse(match[1]);config.outputFileTracingRoot='.';if(config.turbopack)config.turbopack.root='.';server=server.replace(match[0],'const nextConfig = '+JSON.stringify(config));await writeFile(path.join(release,'server.js'),server);
  const required=path.join(release,'.next/required-server-files.json');if((await lstat(required).catch(()=>null))?.isFile()){const value=JSON.parse(await readFile(required,'utf8'));value.appDir='.';value.config=config;await writeFile(required,JSON.stringify(value));}
  const pkg=JSON.parse(await readFile(path.join(release,'package.json'),'utf8'));await writeFile(path.join(release,'package.json'),JSON.stringify({name:pkg.name,version:pkg.version,private:true,scripts:{start:'node server.js'}})+'\n');
  await writeFile(path.join(release,'DEPLOY_SHA'),sha+'\n');
  const inventory=await entries(release);
  if(!inventory.some(item=>item.path==='.portfolio-release/site/site-manifest.json'))throw new Error('Traced release site is missing');
  for(const item of inventory){if(!/^(?:server\.js|package\.json|DEPLOY_SHA|\.next\/|node_modules\/|\.portfolio-release\/site\/)/.test(item.path)||forbidden.test(item.path))throw new Error('Runtime allowlist rejection: '+item.path);}
  // First-party generated files must contain portable paths, never the build checkout.
  for(const item of inventory.filter(item=>!item.path.startsWith('node_modules/')&&/\.(?:json|js|html)$/.test(item.path))){const text=await readFile(path.join(release,item.path),'utf8');if(text.includes(sourceRoot)||text.includes('/Users/designer/'))throw new Error('Local build path leaked: '+item.path);}
  await writeFile(path.join(release,'RELEASE_MANIFEST.json'),JSON.stringify({protocol:'art-des-deploy-v2',targetSha:sha,entries:inventory},null,2)+'\n');
  await mkdir(path.dirname(archive),{recursive:true});await exec('tar',[...(process.platform==='darwin'?['--no-mac-metadata','--no-xattrs','--no-acls','--no-fflags']:[]),'-czf',archive,'-C',release,'.'],{env:{...process.env,COPYFILE_DISABLE:'1'}});
  const bytes=(await stat(archive)).size;if(bytes>75*1024*1024)throw new Error('Runtime exceeds 75 MiB archive limit');
  return {sha,contentHash:site.snapshotSha256,contentOrigin:site.provenance.origin,bytes,artifactSha256:hash(await readFile(archive)),entries:inventory.length};
 }finally{await rm(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const {stdout}=await exec('git',['rev-parse','HEAD'],{cwd:sourceRoot});const sha=stdout.trim();const archive=process.argv[2]?path.resolve(process.argv[2]):path.join(sourceRoot,'.portfolio-release',sha+'.tar.gz');console.log(JSON.stringify(await createRuntimeReleaseArchive({sourceRoot,archive,sha,expectedContentHash:process.env.PORTFOLIO_RELEASE_SNAPSHOT_SHA256})));
}
