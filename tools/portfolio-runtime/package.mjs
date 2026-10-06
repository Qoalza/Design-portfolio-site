import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPortfolioArtifact} from './artifact.mjs';
import {contentHash} from '../portfolio-delivery/contract.mjs';
const exec=promisify(execFile),repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export async function packagePortfolio({root=path.join(repoRoot,'.portfolio-release/portfolio'),archive}={}){
 const manifest=await verifyPortfolioArtifact(root),sha=manifest.portfolioBuildId.sourceSha;
 const {stdout:head}=await exec('git',['rev-parse','HEAD'],{cwd:repoRoot});
 const {stdout:dirty}=await exec('git',['status','--porcelain','--untracked-files=normal','--','.',':!USERSPACE'],{cwd:repoRoot});
 if(manifest.sourceDirty||head.trim()!==sha||dirty.trim())throw new Error('Portfolio packaging requires clean exact built HEAD');
 archive=archive||path.join(repoRoot,'.portfolio-release','portfolio-'+sha+'.tar.gz');
 await mkdir(path.dirname(archive),{recursive:true});
 await exec('tar',[...(process.platform==='darwin'?['--no-mac-metadata','--no-xattrs','--no-acls','--no-fflags']:[]),'-czf',archive,'-C',root,'.'],{env:{...process.env,COPYFILE_DISABLE:'1'}});
 const bytes=await readFile(archive);
 return {portfolioBuildId:manifest.portfolioBuildId,rendererId:manifest.renderer.rendererId,archive,sha256:contentHash(bytes),size:bytes.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))packagePortfolio({archive:process.argv[2]?path.resolve(process.argv[2]):undefined}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
