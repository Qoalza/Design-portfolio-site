import {cp,readFile,writeFile} from 'node:fs/promises';import path from 'node:path';
import {artifactFiles,verifyPortfolioArtifact} from '../../tools/portfolio-runtime/artifact.mjs';
import {canonicalJSON,contentHash} from '../../tools/portfolio-delivery/contract.mjs';
import {cmsArtifactFiles,verifyCMSArtifact,canonical,hash} from '../../tools/payload-admin/scripts/artifact.mjs';
// Synthetic derivatives change only host bytes in disposable retained packages.
// They prove real process/controller transitions, not independent source builds or renderer fidelity.
export async function derivative(release,{root,app,fail=false}){
 await cp(release.artifactRoot,root,{recursive:true,verbatimSymlinks:true});
 const entry=path.join(root,app==='portfolio'?'server.mjs':'tools/payload-admin/server.js');
 const bytes=await readFile(entry);await writeFile(entry,fail?Buffer.concat([Buffer.from('throw new Error("Synthetic fixture startup rejection");\n'),bytes]):Buffer.concat([bytes,Buffer.from('\n// Synthetic retained host version\n')]));
 const file=path.join(root,app==='portfolio'?'release-manifest.json':'cms-release-manifest.json'),manifest=JSON.parse(await readFile(file,'utf8'));manifest.sourceDirty=true;
 if(app==='portfolio'){manifest.files=await artifactFiles(root);manifest.portfolioBuildId.artifactSha256=contentHash(canonicalJSON({files:manifest.files,renderer:manifest.renderer}));await writeFile(file,canonicalJSON(manifest));await verifyPortfolioArtifact(root);return {...release,artifactRoot:root,portfolioBuildId:manifest.portfolioBuildId};}
 manifest.files=await cmsArtifactFiles(root);const {cmsBuildId,...body}=manifest;manifest.cmsBuildId={...cmsBuildId,artifactSha256:hash(canonical(body))};await writeFile(file,canonical(manifest));await verifyCMSArtifact(root,{fixture:true});return {...release,artifactRoot:root,cmsBuildId:manifest.cmsBuildId};
}
