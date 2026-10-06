import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {canonicalJSON} from '../portfolio-delivery/contract.mjs';
import {readCodeSelection} from './code-selection.mjs';import {validatePortfolioRelease} from './active-release.mjs';import {verifyPortfolioArtifact} from './artifact.mjs';
export async function startActivePortfolio({file=process.env.PORTFOLIO_ACTIVE_RELEASE,contentRoot=process.env.PORTFOLIO_CONTENT_ROOT,port=Number(process.env.PORTFOLIO_PORT||3101),fixture=false}={}){
 if(!file||!path.isAbsolute(file))throw new Error('Explicit Portfolio active release required');
 const selected=await readCodeSelection(file,'portfolio',validatePortfolioRelease,async release=>{
  const manifest=await verifyPortfolioArtifact(release.artifactRoot);
  if(!fixture&&manifest.sourceDirty)throw new Error('Portfolio launcher requires a clean release');
  if(canonicalJSON(manifest.portfolioBuildId)!==canonicalJSON(release.portfolioBuildId)||canonicalJSON(manifest.renderer)!==canonicalJSON(release.renderer))throw new Error('Selected Portfolio artifact differs');
 });
 const {startPortfolio}=await import(pathToFileURL(path.join(selected.release.artifactRoot,'server.mjs')).href);
 return startPortfolio({root:selected.release.artifactRoot,contentRoot,port,codeActivationSeq:selected.activationSeq});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))startActivePortfolio().catch(error=>{console.error(error.message);process.exitCode=1;});
