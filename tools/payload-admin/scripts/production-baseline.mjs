import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import path from 'node:path';
import {validateProjectSnapshot,createProjectSnapshot} from '../../portfolio-release/project-snapshot.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function readBoundFile(root,name,maxBytes){
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(name)||name.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('Unsafe production baseline path');
 let current=root;
 for(const part of name.split('/')){current=path.join(current,part);if((await lstat(current)).isSymbolicLink())throw new Error('Production baseline symlink');}
 const file=await open(current,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const stat=await file.stat();if(!stat.isFile()||stat.size>maxBytes)throw new Error('Invalid production baseline file');return await file.readFile();}finally{await file.close();}
}
// Identity is supplied by a fresh external production preflight, never inferred
// from local files or a CMS sandbox. This reader performs no writes or bootstrap.
/**
 * @param {{root:string,expectedSha:string,expectedContentHash:string}} options
 * @returns {Promise<{projects:import('../../../src/lib/project-contract').ProjectDocument[],assets:Array<{publicPath:string,sha256:string,size:number,bytes:Buffer}>,provenance:{origin:'approved-git-code',sourceSha:string,externalDependencies?:string[]},releaseIdentity:{sha:string,contentHash:string}}>}
 */
export async function readDeployedSiteBaseline({root,expectedSha,expectedContentHash}){
 if(!path.isAbsolute(root)||!/^[a-f0-9]{40}$/.test(expectedSha)||!/^[a-f0-9]{64}$/.test(expectedContentHash))throw new Error('Explicit production baseline identity required');
 const stat=await lstat(root);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('Production baseline root must be a directory without symlink');
 const manifestBytes=await readBoundFile(root,'site-manifest.json',4*1024*1024),manifest=JSON.parse(manifestBytes);
 if(manifest.version!==1||manifest.buildSha!==expectedSha||manifest.sourceDirty!==false||manifest.snapshotSha256!==expectedContentHash||!Array.isArray(manifest.files))throw new Error('Production baseline identity mismatch');
 const snapshotBytes=await readBoundFile(root,'snapshot.json',4*1024*1024);
 if(hash(snapshotBytes)!==expectedContentHash)throw new Error('Production baseline snapshot digest mismatch');
 const snapshot=validateProjectSnapshot(JSON.parse(snapshotBytes));
 if(snapshot.provenance.origin!=='approved-git-code'||!isDeepStrictEqual(manifest.provenance,snapshot.provenance))throw new Error('Initial production baseline provenance mismatch');
 const entries=new Map();
 for(const entry of manifest.files){if(entries.has(entry.path))throw new Error('Duplicate production asset manifest entry');entries.set(entry.path,entry);}
 const assets=[];
 for(const item of snapshot.assets){
  const name=item.publicPath.slice(1),entry=entries.get(name);
  if(!entry||entry.sha256!==item.sha256||entry.bytes!==item.size)throw new Error('Production asset manifest mismatch');
  const bytes=await readBoundFile(root,name,20*1024*1024);
  if(bytes.length!==item.size||hash(bytes)!==item.sha256)throw new Error('Production asset checksum mismatch');
  assets.push({...item,bytes});
 }
 if(!(await readBoundFile(root,'site-manifest.json',4*1024*1024)).equals(manifestBytes)||!(await readBoundFile(root,'snapshot.json',4*1024*1024)).equals(snapshotBytes))throw new Error('Production baseline changed during verification');
 const prepared={projects:snapshot.projects,assets,provenance:snapshot.provenance};
 createProjectSnapshot(prepared);
 return {...prepared,releaseIdentity:{sha:expectedSha,contentHash:expectedContentHash}};
}

// Read-only compatibility with the deployed static release without snapshot.json.
export async function readLegacyDeployedSiteBaseline({root,expectedSha,repoRoot}){
 if(!path.isAbsolute(root)||!path.isAbsolute(repoRoot)||!/^[a-f0-9]{40}$/.test(expectedSha))throw new Error('Explicit legacy production identity required');
 const stat=await lstat(root);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('Production baseline root must be a directory without symlink');
 const manifestBytes=await readBoundFile(root,'site-manifest.json',4*1024*1024),manifest=JSON.parse(manifestBytes);
 if(manifest.version!==1||manifest.buildSha!==expectedSha||manifest.sourceDirty!==false||manifest.snapshotSha256!=null||!Array.isArray(manifest.files))throw new Error('Legacy production baseline identity mismatch');
 const {exportApprovedRedesign}=await import('../../concept-v2/export-approved-content.mjs');
 const approved=await exportApprovedRedesign({repoRoot});
 if(!isDeepStrictEqual(manifest.provenance,approved.provenance))throw new Error('Legacy production source provenance mismatch');
 const entries=new Map();for(const entry of manifest.files){if(entries.has(entry.path))throw new Error('Duplicate production asset manifest entry');entries.set(entry.path,entry);}
 const assets=[];
 for(const asset of approved.assets){
  const name=asset.publicPath.slice(1),entry=entries.get(name);
  if(!entry||entry.sha256!==asset.sha256||entry.bytes!==asset.bytes.length)throw new Error('Legacy production asset manifest mismatch');
  const bytes=await readBoundFile(root,name,20*1024*1024);
  if(bytes.length!==entry.bytes||hash(bytes)!==entry.sha256||!bytes.equals(asset.bytes))throw new Error('Legacy production asset checksum mismatch');
  assets.push({...asset,size:bytes.length,bytes});
 }
 if(!(await readBoundFile(root,'site-manifest.json',4*1024*1024)).equals(manifestBytes))throw new Error('Production baseline changed during verification');
 const prepared={projects:approved.projects,assets,provenance:approved.provenance};
 return {...prepared,releaseIdentity:{sha:expectedSha,contentHash:hash(Buffer.from(JSON.stringify(createProjectSnapshot(prepared))))}};
}
