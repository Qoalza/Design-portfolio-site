import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,symlink,rm} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {verifyPortfolioArtifact} from '../../tools/portfolio-runtime/artifact.mjs';
import {cmsSourceHash} from '../../tools/payload-admin/scripts/source-hash.mjs';
const exec=promisify(execFile);
export const sourceBuildMarker='separated-public-source-build-fixture-v1';

// Exact allowlist: no private roots, canonical content, USERSPACE or adjacent checkout.
// The source edit and Git commit exist only inside the disposable fixture repository.
export async function buildPublicSourceFixture({repo,parent}) {
 assert.ok(path.basename(parent).startsWith('des-art-payload-test-package-proof-'));
 const root=path.join(parent,'public-source'),archive=path.join(parent,'public-source.tar');
 const cmsHash=await cmsSourceHash(),cmsCandidate=await readFile(path.join(repo,'tools/payload-admin/.cms-builds/candidate.json'),'utf8');
 await mkdir(root);
 const paths=['.gitignore','package.json','package-lock.json','tools/portfolio-runtime','tools/portfolio-delivery','tools/portfolio-release','tools/payload-admin/scripts','tools/concept-v2/app/src','tools/concept-v2/app/vendor','tools/concept-v2/app/index.html','tools/concept-v2/app/package.json','tools/concept-v2/app/package-lock.json','tools/concept-v2/app/public/figma','tools/concept-v2/app/public/fonts','tools/concept-v2/app/public/cursors','tools/concept-v2/app/public/assets','src/lib','public/artur-designer-favicon.svg','public/artur-designer-social-preview.png'];
 const env={PATH:process.env.PATH,TMPDIR:process.env.TMPDIR,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};
 await exec('git',['archive','--format=tar','--output='+archive,'HEAD',...paths],{cwd:repo,env});
 await exec('tar',['-xf',archive,'-C',root],{env});await rm(archive);
 for(const directory of ['node_modules','tools/concept-v2/app/node_modules'])await symlink(path.join(repo,directory),path.join(root,directory),'dir');
 const entry=path.join(root,'tools/concept-v2/app/src/main-release.jsx');
 await writeFile(entry,(await readFile(entry,'utf8'))+`\ndocument.documentElement.dataset.separationFixtureBuild=${JSON.stringify(sourceBuildMarker)};\n`);
 await exec('git',['init','--quiet'],{cwd:root,env});
 await writeFile(path.join(root,'.git/info/exclude'),'node_modules\n');
 await exec('git',['add','--',...paths],{cwd:root,env});
 await exec('git',['-c','user.name=Separation fixture','-c','user.email=fixture@example.test','-c','commit.gpgsign=false','commit','--quiet','-m','Synthetic public source build fixture'],{cwd:root,env});
 const output=path.join(root,'.portfolio-release/portfolio');
 await exec(process.execPath,['--experimental-strip-types','tools/portfolio-runtime/build.mjs'],{cwd:root,env,maxBuffer:4*1024*1024});
 const manifest=await verifyPortfolioArtifact(output);
 assert.equal(manifest.sourceDirty,false);
 assert.equal(await cmsSourceHash(),cmsHash,'public source build did not change CMS build inputs');
 assert.equal(await readFile(path.join(repo,'tools/payload-admin/.cms-builds/candidate.json'),'utf8'),cmsCandidate,'public source build did not select a new CMS build');
 const scripts=manifest.files.filter(file=>/^site\/assets\/.*\.js$/.test(file.path));
 assert.ok((await Promise.all(scripts.map(file=>readFile(path.join(output,file.path),'utf8')))).some(bytes=>bytes.includes(sourceBuildMarker)),'actual compiler output includes source edit');
 return {version:1,artifactRoot:output,portfolioBuildId:manifest.portfolioBuildId,renderer:manifest.renderer};
}
