import {lstat,readdir,open,constants,readlink,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';import path from 'node:path';
export const producer={contractVersions:['public-delivery-v1'],capabilities:['project-v3','redesign-v1','hero-layout','hero-raster','empty-collection','scoped-assets-v1']};
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';const result=JSON.stringify(value);if(result===undefined)throw new Error('Artifact identity must be JSON');return result;}
export function runtimePlatform(){return {platform:process.platform,arch:process.arch,nodeMajor:Number(process.versions.node.split('.')[0]),libc:process.platform==='linux'?(process.report.getReport().header.glibcVersionRuntime?'glibc':'musl'):null};}
async function bytes(file,max=128*1024*1024){const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);try{const stat=await fd.stat();if(!stat.isFile()||stat.size>max)throw new Error('Invalid artifact file');return await fd.readFile();}finally{await fd.close();}}
export async function cmsArtifactFiles(root){
 const rootStat=await lstat(root);if(rootStat.isSymbolicLink()||!rootStat.isDirectory())throw new Error('CMS artifact root must be a regular directory');
 const actualRoot=await realpath(root),files=[];let total=0;
 async function walk(directory){for(const name of (await readdir(directory)).sort()){
  const file=path.join(directory,name),relative=path.relative(root,file).split(path.sep).join('/');
  if(relative==='cms-release-manifest.json')continue;
  const stat=await lstat(file);
  const parentOnly=['tools','tools/payload-admin','node_modules'].includes(relative)&&stat.isDirectory();
  if(relative.split('/').some(part=>['USERSPACE','cms.db','secret','.git'].includes(part)||part.startsWith('.local')||part==='.env'||part.startsWith('.env.'))||(!relative.startsWith('node_modules/')&&!relative.startsWith('tools/payload-admin/')&&relative!=='package.json'&&!parentOnly))throw new Error('CMS artifact allowlist rejection');
  if(stat.isDirectory()){await walk(file);continue;}
  if(files.length>=50000)throw new Error('CMS artifact file bound exceeded');
  if(stat.isSymbolicLink()){
   const target=await readlink(file);if(path.isAbsolute(target))throw new Error('CMS artifact contains absolute symlink');
   const resolved=await realpath(file);if(!resolved.startsWith(actualRoot+path.sep))throw new Error('CMS artifact symlink escapes release');
   files.push({path:relative,kind:'symlink',target});
  }else if(stat.isFile()){
   total+=stat.size;if(total>1024*1024*1024)throw new Error('CMS artifact size bound exceeded');
   const data=await bytes(file);if(data.length!==stat.size)throw new Error('CMS artifact changed during verification');
   if(/\.node$/.test(relative)){
    if(process.platform==='linux'){
     const machine=process.arch==='x64'?62:process.arch==='arm64'?183:null;
     if(data.length<20||data.subarray(0,4).toString('hex')!=='7f454c46'||data[4]!==2||data[5]!==1||machine===null||data.readUInt16LE(18)!==machine)throw new Error('CMS native module platform mismatch');
    }else if(process.platform==='darwin'){
     const cpu=process.arch==='arm64'?0x0100000c:process.arch==='x64'?0x01000007:null;
     if(data.length<8||data.readUInt32LE(0)!==0xfeedfacf||cpu===null||data.readUInt32LE(4)!==cpu)throw new Error('CMS native module platform mismatch');
    }else throw new Error('Unsupported CMS native platform');
   }

   files.push({path:relative,kind:'file',size:data.length,mode:stat.mode&0o777,sha256:hash(data)});
  }else throw new Error('CMS artifact contains special file');
 }}
 await walk(root);return files.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}
function exact(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==keys.sort().join(','))throw new Error('Invalid CMS artifact manifest shape');}
export async function verifyCMSArtifact(root,{fixture=false}={}){
 const rootInfo=await lstat(root);if(rootInfo.isSymbolicLink()||!rootInfo.isDirectory())throw new Error('CMS artifact root must be a regular directory');
 const manifest=JSON.parse((await bytes(path.join(root,'cms-release-manifest.json'),16*1024*1024)).toString());
 exact(manifest,['version','cmsBuildId','sourceHash','sourceDirty','runtime','schemaHash','producer','buildDir','files']);exact(manifest.cmsBuildId,['sourceSha','artifactSha256']);exact(manifest.runtime,['platform','arch','nodeMajor','libc']);
 if(manifest.version!==1||typeof manifest.sourceDirty!=='boolean'||!Array.isArray(manifest.files)||manifest.files.length>50000||!/^\.cms-builds\/[a-f0-9-]{36}$/.test(manifest.buildDir)||!/^[a-f0-9]{64}$/.test(manifest.schemaHash)||!/^[a-f0-9]{64}$/.test(manifest.sourceHash)||!/^[a-f0-9]{40}$/.test(manifest.cmsBuildId.sourceSha)||canonical(manifest.producer)!==canonical(producer))throw new Error('Invalid CMS artifact identity');
 if(canonical(manifest.runtime)!==canonical(runtimePlatform())||(!fixture&&(manifest.sourceDirty||manifest.runtime.platform!=='linux')))throw new Error('CMS artifact platform or release provenance mismatch');
 const files=await cmsArtifactFiles(root);
 if(canonical(files)!==canonical(manifest.files)||!files.some(f=>f.path==='tools/payload-admin/server.js')||!files.some(f=>f.path==='tools/payload-admin/scripts/artifact-start.mjs')||!files.some(f=>f.path==='tools/payload-admin/scripts/writer-child.mjs')||!files.some(f=>f.path==='tools/payload-admin/'+manifest.buildDir+'/BUILD_ID')||!files.some(f=>f.path.startsWith('tools/payload-admin/'+manifest.buildDir+'/static/')))throw new Error('CMS artifact integrity failure');
 const {cmsBuildId,...body}=manifest;
 if(hash(canonical(body))!==cmsBuildId.artifactSha256)throw new Error('CMS artifact digest mismatch');
 return manifest;
}
