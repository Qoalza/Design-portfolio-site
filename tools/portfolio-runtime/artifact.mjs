import {readFile,lstat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {contentHash,canonicalJSON,validateRenderer,exactObject} from '../portfolio-delivery/contract.mjs';
export async function artifactFiles(root,directory=root) {
 const result=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const name=path.join(directory,entry.name);
  if(entry.isSymbolicLink())throw new Error('Portfolio artifact cannot contain symlinks');
  if(entry.isDirectory())result.push(...await artifactFiles(root,name));
  else if(entry.isFile()){
   const relative=path.relative(root,name).split(path.sep).join('/');
   if(relative==='release-manifest.json')continue;
   if(!/^(?:server\.mjs$|ops\/active-start\.mjs$|site\/|preview\/)/.test(relative)||/\.(?:map|node|dylib|so)$/.test(relative)||relative.split('/').some(p=>p.startsWith('.')))throw new Error('Portfolio artifact allowlist rejection');
   const bytes=await readFile(name);result.push({path:relative,size:bytes.length,sha256:contentHash(bytes)});
  }else throw new Error('Invalid Portfolio artifact entry');
 }
 return result.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}
export async function verifyPortfolioArtifact(root) {
 if((await lstat(root)).isSymbolicLink())throw new Error('Portfolio artifact root cannot be symlink');
 if(!(await lstat(path.join(root,'release-manifest.json'))).isFile())throw new Error('Artifact manifest must be a regular file');
 const manifest=JSON.parse(await readFile(path.join(root,'release-manifest.json'),'utf8'));
 exactObject(manifest,['version','portfolioBuildId','renderer','sourceDirty','files'],'Portfolio artifact');
 if(manifest.version!==1||typeof manifest.sourceDirty!=='boolean'||!Array.isArray(manifest.files))throw new Error('Invalid Portfolio artifact manifest');
 if(manifest.files.length>4096||manifest.files.reduce((sum,file)=>sum+file.size,0)>256*1024*1024)throw new Error('Portfolio artifact exceeds bounds');
 validateRenderer(manifest.renderer);
 const files=await artifactFiles(root);
 if(canonicalJSON(files)!==canonicalJSON(manifest.files)||!files.some(f=>f.path==='server.mjs')||!files.some(f=>f.path==='site/index.html')||!files.some(f=>f.path==='preview/index.html'))throw new Error('Portfolio artifact integrity failure');
 exactObject(manifest.portfolioBuildId,['sourceSha','artifactSha256'],'Portfolio build identity');
 if(!/^[a-f0-9]{40}$/.test(manifest.portfolioBuildId.sourceSha)||contentHash(canonicalJSON({files,renderer:manifest.renderer}))!==manifest.portfolioBuildId.artifactSha256)throw new Error('Invalid Portfolio build identity');
 return manifest;
}
