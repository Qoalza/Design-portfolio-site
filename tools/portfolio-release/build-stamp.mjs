import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';import path from 'node:path';import {fileURLToPath} from 'node:url';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fingerprint(root){
 const digest=createHash('sha256');
 async function walk(dir){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name),name=path.relative(root,file).split(path.sep).join('/');if(entry.isSymbolicLink())throw new Error('Build fingerprint rejects symlinks');if(/(^|\/)(USERSPACE|\.local)(\/|$)|(^|\/)\.env(\.|$)/.test(name))throw new Error('Private file in build');if(entry.isDirectory())await walk(file);else if(entry.isFile()){digest.update(name);digest.update(hash(await readFile(file)));}else throw new Error('Unsupported build entry');}}
 await walk(root);return digest.digest('hex');
}
async function buildState(sourceRoot){
 const source=await readFile(path.join(sourceRoot,'.portfolio-release/site/site-manifest.json'));
 const copied=await readFile(path.join(sourceRoot,'.next/standalone/.portfolio-release/site/site-manifest.json'));
 if(!source.equals(copied))throw new Error('Stale standalone site manifest');
 const site=JSON.parse(source.toString('utf8'));
 if(hash(await readFile(path.join(sourceRoot,'.portfolio-release/site/snapshot.json')))!==site.snapshotSha256)throw new Error('Site content snapshot mismatch');
 return {version:1,contentHash:site.snapshotSha256,contentOrigin:site.provenance.origin,sha:site.buildSha,sourceDirty:site.sourceDirty,siteHash:hash(source),buildId:(await readFile(path.join(sourceRoot,'.next/BUILD_ID'),'utf8')).trim(),standaloneHash:await fingerprint(path.join(sourceRoot,'.next/standalone')),staticHash:await fingerprint(path.join(sourceRoot,'.next/static'))};
}
export async function stampNextBuild(sourceRoot){
 const state=await buildState(sourceRoot);
 await writeFile(path.join(sourceRoot,'.portfolio-release/next-build.json'),JSON.stringify(state)+'\n');
 return state;
}
export async function verifyNextBuild(sourceRoot,sha){
 const stamp=JSON.parse(await readFile(path.join(sourceRoot,'.portfolio-release/next-build.json'),'utf8'));
 if(stamp.sha!==sha||stamp.sourceDirty||!stamp.buildId)throw new Error('No completed clean Next build for exact SHA');
 const current=await buildState(sourceRoot);
 if(JSON.stringify(current)!==JSON.stringify(stamp))throw new Error('Stale or modified Next build');
 return current;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Recorded successful Next build:',(await stampNextBuild(path.resolve(import.meta.dirname,'../..'))).sha);
