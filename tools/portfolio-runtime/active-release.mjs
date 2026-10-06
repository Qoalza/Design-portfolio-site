import path from 'node:path';
import {readJSON,assertDirectory} from '../portfolio-delivery/durable-store.mjs';
import {canonicalJSON,digestPattern,exactObject,validateRenderer} from '../portfolio-delivery/contract.mjs';
import {verifyPortfolioArtifact} from './artifact.mjs';
const verified=new Map();
export function validatePortfolioRelease(value) {
 exactObject(value,['version','artifactRoot','portfolioBuildId','renderer'],'Active Portfolio release');
 exactObject(value.portfolioBuildId,['sourceSha','artifactSha256'],'Active Portfolio build');
 validateRenderer(value.renderer);
 if(value.version!==1||typeof value.artifactRoot!=='string'||!path.isAbsolute(value.artifactRoot)||path.resolve(value.artifactRoot)!==value.artifactRoot||value.artifactRoot==='/'||!/^[a-f0-9]{40}$/.test(value.portfolioBuildId.sourceSha)||!digestPattern.test(value.portfolioBuildId.artifactSha256))throw new Error('Invalid active Portfolio release descriptor.');
 return structuredClone(value);
}
export async function readPortfolioRelease(file,{requireClean=true}={}) {
 if(typeof file!=='string'||!path.isAbsolute(file))throw new Error('An explicit absolute Portfolio release descriptor is required.');
 const release=validatePortfolioRelease(await readJSON(file,16384));
 await assertDirectory(release.artifactRoot);
 const key=canonicalJSON(release);
 if(!verified.has(key)) {
  if(verified.size>=4)verified.delete(verified.keys().next().value);
  const pending=verifyPortfolioArtifact(release.artifactRoot);
  verified.set(key,pending);pending.catch(()=>{if(verified.get(key)===pending)verified.delete(key);});
 }
 const manifest=await verified.get(key);
 if((requireClean&&manifest.sourceDirty)||canonicalJSON(manifest.renderer)!==canonicalJSON(release.renderer)||canonicalJSON(manifest.portfolioBuildId)!==canonicalJSON(release.portfolioBuildId))throw new Error('Active Portfolio artifact identity differs from descriptor.');
 // No source path or compiler lookup. The immutable artifact's preview is the
 // exact counterpart of the active public renderer, even after CMS code release.
 return {...release,previewRoot:path.join(release.artifactRoot,'preview')};
}
