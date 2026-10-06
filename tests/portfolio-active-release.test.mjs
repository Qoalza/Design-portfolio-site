import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import path from 'node:path';
import {readPortfolioRelease} from '../tools/portfolio-runtime/active-release.mjs';
import {artifactFiles} from '../tools/portfolio-runtime/artifact.mjs';
import {canonicalJSON,contentHash,DELIVERY_CAPABILITIES} from '../tools/portfolio-delivery/contract.mjs';
test('active release selects the verified artifact preview and rejects mismatched/dirty/symlink descriptors',async()=>{
 const root=await mkdtemp('/private/tmp/portfolio-active-release-');
 try {
  const artifactRoot=path.join(root,'artifact');await mkdir(artifactRoot);
  for(const name of ['server.mjs','site/index.html','preview/index.html']){await mkdir(path.dirname(path.join(artifactRoot,name)),{recursive:true});await writeFile(path.join(artifactRoot,name),'fixture '+name);}
  const renderer={rendererId:'a'.repeat(64),contractVersion:'public-delivery-v1',capabilities:DELIVERY_CAPABILITIES},files=await artifactFiles(artifactRoot);
  const portfolioBuildId={sourceSha:'b'.repeat(40),artifactSha256:contentHash(canonicalJSON({files,renderer}))};
  await writeFile(path.join(artifactRoot,'release-manifest.json'),JSON.stringify({version:1,renderer,portfolioBuildId,sourceDirty:true,files}));
  const file=path.join(root,'active-code.json'),release={version:1,artifactRoot,renderer,portfolioBuildId};await writeFile(file,JSON.stringify(release));
  await assert.rejects(()=>readPortfolioRelease(file));
  assert.equal((await readPortfolioRelease(file,{requireClean:false})).previewRoot,path.join(artifactRoot,'preview'));
  await writeFile(file,JSON.stringify({...release,portfolioBuildId:{...portfolioBuildId,artifactSha256:'c'.repeat(64)}}));await assert.rejects(()=>readPortfolioRelease(file,{requireClean:false}));
  await writeFile(file,JSON.stringify({...release,renderer:{...renderer,rendererId:'d'.repeat(64)}}));await assert.rejects(()=>readPortfolioRelease(file,{requireClean:false}));
  const linked=path.join(root,'linked');await symlink(artifactRoot,linked);await writeFile(file,JSON.stringify({...release,artifactRoot:linked}));await assert.rejects(()=>readPortfolioRelease(file,{requireClean:false}));
 }finally{await rm(root,{recursive:true,force:true});}
});
