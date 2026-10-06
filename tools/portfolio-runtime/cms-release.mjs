import path from 'node:path';
import {readJSON,assertDirectory} from '../portfolio-delivery/durable-store.mjs';
import {canonicalJSON,digestPattern,exactObject} from '../portfolio-delivery/contract.mjs';
import {verifyCMSArtifact,producer,runtimePlatform} from '../payload-admin/scripts/artifact.mjs';
export function validateCMSRelease(value){
 exactObject(value,['version','artifactRoot','cmsBuildId','schemaHash','producer','runtime'],'CMS release');
 exactObject(value.cmsBuildId,['sourceSha','artifactSha256'],'CMS build');
 if(value.version!==1||typeof value.artifactRoot!=='string'||!path.isAbsolute(value.artifactRoot)||path.resolve(value.artifactRoot)!==value.artifactRoot||value.artifactRoot==='/'||!/^[a-f0-9]{40}$/.test(value.cmsBuildId.sourceSha)||!digestPattern.test(value.cmsBuildId.artifactSha256)||!digestPattern.test(value.schemaHash)||canonicalJSON(value.producer)!==canonicalJSON(producer)||canonicalJSON(value.runtime)!==canonicalJSON(runtimePlatform()))throw new Error('Invalid CMS release descriptor');
 return structuredClone(value);
}
export async function verifyCMSRelease(value,{fixture=false}={}){
 const release=validateCMSRelease(value);await assertDirectory(release.artifactRoot);
 const manifest=await verifyCMSArtifact(release.artifactRoot,{fixture});
 for(const name of ['cmsBuildId','schemaHash','producer','runtime'])if(canonicalJSON(manifest[name])!==canonicalJSON(release[name]))throw new Error('CMS artifact differs from selected descriptor');
 return release;
}
export async function readCMSRelease(file,options){return verifyCMSRelease(await readJSON(file,16384),options);}
