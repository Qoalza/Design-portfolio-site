import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {locations} from './state.mjs';import {superviseCMS} from './supervisor.mjs';
import {validateCMSRelease,verifyCMSRelease} from '../../portfolio-runtime/cms-release.mjs';import {readCodeSelection} from '../../portfolio-runtime/code-selection.mjs';
export async function startActiveCMS(){
 const state=locations(),file=process.env.PAYLOAD_ACTIVE_RELEASE;
 if((!state.server&&!state.fixture)||!file||!path.isAbsolute(file))throw new Error('Explicit packaged CMS mode and active release required');
 return superviseCMS({state,load:()=>readCodeSelection(file,'cms',validateCMSRelease,release=>verifyCMSRelease(release,{fixture:state.fixture})),start:async(selected,options)=>{
  const {startCMSArtifact}=await import(pathToFileURL(path.join(selected.release.artifactRoot,'tools/payload-admin/scripts/artifact-start.mjs')).href);
  return startCMSArtifact({...options,codeActivationSeq:selected.activationSeq});
 }});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))startActiveCMS().then(code=>{process.exitCode=code;}).catch(error=>{console.error(error.message);process.exitCode=1;});
