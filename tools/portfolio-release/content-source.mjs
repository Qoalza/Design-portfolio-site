import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {readSnapshotDirectory} from './snapshot-directory.mjs';
import {createProjectSnapshot} from './project-snapshot.mjs';
import {exportApprovedRedesign} from '../concept-v2/export-approved-content.mjs';
export const contentHash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function selectReleaseContent({repoRoot,kind='approved-git-code',directory,expectedInputHash}){
 let prepared;
 if(kind==='approved-git-code'){
  if(directory||expectedInputHash)throw new Error('Initial Git release cannot consume a CMS snapshot');
  prepared=await exportApprovedRedesign({repoRoot});
 }else if(kind==='payload-published'){
  if(!directory||!/^[a-f0-9]{64}$/.test(expectedInputHash??''))throw new Error('Explicit published snapshot path and digest required');
  const file=path.join(directory,'snapshot.json'),input=await readFile(file);
  if(contentHash(input)!==expectedInputHash)throw new Error('Selected snapshot digest mismatch');
  prepared=await readSnapshotDirectory(directory);
  if(prepared.provenance.origin!=='payload-published')throw new Error('CMS release requires published Payload provenance');
  if(!(await readFile(file)).equals(input))throw new Error('Snapshot changed during preparation');
 }else throw new Error('Unknown release content source');
 const snapshot=createProjectSnapshot(prepared),snapshotBytes=Buffer.from(JSON.stringify(snapshot)+'\n');
 return {prepared,snapshotBytes,snapshotSha256:contentHash(snapshotBytes)};
}
