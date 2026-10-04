import { mkdir, readFile, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { createProjectSnapshot, validateProjectSnapshot } from './project-snapshot.mjs';
// A snapshot directory is an immutable preparation artifact, never canonical content.
// Callers choose a fresh destination. Invalid inputs are rejected before any writes.
export async function writeSnapshotDirectory(destination, prepared) {
 const snapshot=createProjectSnapshot(prepared);
 await mkdir(destination,{recursive:false});
 for(const asset of prepared.assets){
  const target=path.join(destination,asset.publicPath.slice(1));
  await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,asset.bytes,{flag:'wx'});
 }
 await writeFile(path.join(destination,'snapshot.json'),JSON.stringify(snapshot)+'\n',{flag:'wx'});
 return snapshot;
}
export async function readSnapshotDirectory(directory) {
 if((await lstat(directory)).isSymbolicLink())throw new Error('Snapshot root cannot be a symlink.');
 const snapshot=validateProjectSnapshot(JSON.parse(await readFile(path.join(directory,'snapshot.json'),'utf8')));
 const assets=[];
 for(const entry of snapshot.assets){
  const target=path.join(directory,entry.publicPath.slice(1));
  const relative=path.relative(directory,target);
  let component=directory;
  for(const part of relative.split(path.sep)){component=path.join(component,part);if((await lstat(component)).isSymbolicLink())throw new Error('Snapshot file path cannot contain symlinks.');}
  const bytes=await readFile(target);
  if(bytes.length!==entry.size)throw new Error('Snapshot asset size mismatch.');
  assets.push({...entry,bytes});
 }
 const prepared={projects:snapshot.projects,assets,provenance:snapshot.provenance};
 createProjectSnapshot(prepared);
 return prepared;
}
