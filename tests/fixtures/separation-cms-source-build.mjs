import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rm,cp} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {verifyCMSArtifact} from '../../tools/payload-admin/scripts/artifact.mjs';
const exec=promisify(execFile);
export const cmsSourceMarker='separated-admin-source-build-fixture-v1';

// Only code and existing dependencies enter this disposable source repository.
// The source edit is never written to the shared working checkout or runtime data.
export async function buildCMSSourceFixture({repo,parent}) {
 assert.ok(path.basename(parent).startsWith('des-art-payload-test-package-proof-'));
 const root=path.join(parent,'cms-source'),archive=path.join(parent,'cms-source.tar');
 const publicManifest=await readFile(path.join(repo,'.portfolio-release/portfolio/release-manifest.json'),'utf8');
 await mkdir(root);
 const paths=['.gitignore','package.json','package-lock.json','tools/portfolio-runtime','tools/portfolio-delivery','tools/portfolio-release','tools/payload-admin/src','tools/payload-admin/scripts','tools/payload-admin/public','tools/payload-admin/tests','tools/payload-admin/package.json','tools/payload-admin/package-lock.json','tools/payload-admin/next.config.mjs','tools/payload-admin/tsconfig.json','src/lib'];
 const env={PATH:process.env.PATH,TMPDIR:process.env.TMPDIR,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};
 await exec('git',['archive','--format=tar','--output='+archive,'HEAD',...paths],{cwd:repo,env});
 await exec('tar',['-xf',archive,'-C',root],{env});await rm(archive);
 await writeFile(path.join(root,'tools/payload-admin/scripts/build.mjs'),await readFile(path.join(repo,'tools/payload-admin/scripts/build.mjs')));
 await cp(path.join(repo,'node_modules'),path.join(root,'node_modules'),{recursive:true,verbatimSymlinks:true});
 // Next tracing needs local dependency paths for a self-contained native artifact.
 await cp(path.join(repo,'tools/payload-admin/node_modules'),path.join(root,'tools/payload-admin/node_modules'),{recursive:true,verbatimSymlinks:true});
 const notice=path.join(root,'tools/payload-admin/src/components/LocalNotice.tsx');
 const source=await readFile(notice,'utf8');assert.ok(source.includes('Опубликованные версии проектов используются сайтом.'));
 await writeFile(notice,source.replace('Опубликованные версии проектов используются сайтом.','Опубликованные версии проектов используются сайтом. '+cmsSourceMarker));
 await exec('git',['init','--quiet'],{cwd:root,env});await writeFile(path.join(root,'.git/info/exclude'),'node_modules\n');
 await exec('git',['add','--',...paths],{cwd:root,env});
 await exec('git',['-c','user.name=Separation fixture','-c','user.email=fixture@example.test','-c','commit.gpgsign=false','commit','--quiet','-m','Synthetic Admin-only source build fixture'],{cwd:root,env});
 await exec(process.execPath,['tools/payload-admin/scripts/build.mjs'],{cwd:root,env,maxBuffer:4*1024*1024});
 const packaged=await exec(process.execPath,['tools/payload-admin/scripts/package.mjs','--fixture'],{cwd:root,env,maxBuffer:4*1024*1024});
 const result=JSON.parse(packaged.stdout.trim().split('\n').findLast(line=>line.startsWith('{')));
 const manifest=await verifyCMSArtifact(result.root,{fixture:true});assert.equal(manifest.sourceDirty,false);
 assert.equal(await readFile(path.join(repo,'.portfolio-release/portfolio/release-manifest.json'),'utf8'),publicManifest,'Admin source build did not rebuild public artifact');
 const staticPrefix='tools/payload-admin/'+manifest.buildDir+'/static/';
 const chunks=manifest.files.filter(file=>file.path.startsWith(staticPrefix)&&file.path.endsWith('.js'));
 let markerURL;
 for(const chunk of chunks){if((await readFile(path.join(result.root,chunk.path),'utf8')).includes(cmsSourceMarker)){markerURL='/_next/static/'+chunk.path.slice(staticPrefix.length);break;}}
 assert.ok(markerURL,'actual CMS compiler output includes copied source edit');
 return {release:{version:1,artifactRoot:result.root,cmsBuildId:manifest.cmsBuildId,schemaHash:manifest.schemaHash,producer:manifest.producer,runtime:manifest.runtime},markerURL};
}
