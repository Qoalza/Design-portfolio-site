import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,rm,symlink,realpath} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {cmsArtifactFiles,verifyCMSArtifact,runtimePlatform,producer,hash,canonical} from '../tools/payload-admin/scripts/artifact.mjs';
const buildDir='.cms-builds/11111111-1111-1111-1111-111111111111';
async function fixture(t){const root=await mkdtemp(path.join(await realpath(os.tmpdir()),'des-art-payload-test-artifact-'));t.after(()=>rm(root,{recursive:true,force:true}));for(const file of ['tools/payload-admin/server.js','tools/payload-admin/scripts/artifact-start.mjs','tools/payload-admin/scripts/writer-child.mjs','tools/payload-admin/'+buildDir+'/BUILD_ID','tools/payload-admin/'+buildDir+'/static/a.js']){await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),'fixture');}return root;}
async function manifest(root){const body={version:1,sourceHash:'1'.repeat(64),sourceDirty:false,runtime:runtimePlatform(),schemaHash:'2'.repeat(64),producer,buildDir,files:await cmsArtifactFiles(root)};const value={...body,cmsBuildId:{sourceSha:'3'.repeat(40),artifactSha256:hash(canonical(body))}};await writeFile(path.join(root,'cms-release-manifest.json'),canonical(value));return value;}
test('CMS artifact binds exact files/native platform/schema/producer and preserves safe internal dependency links',async t=>{
 const root=await fixture(t);await mkdir(path.join(root,'node_modules/module'),{recursive:true});await writeFile(path.join(root,'node_modules/module/index.js'),'module');await symlink('module',path.join(root,'node_modules/alias'));
 const value=await manifest(root);assert.deepEqual(await verifyCMSArtifact(root,{fixture:true}),value);
 await writeFile(path.join(root,'node_modules/module/index.js'),'changed');await assert.rejects(verifyCMSArtifact(root,{fixture:true}),/integrity/);
});
test('CMS artifact refuses escaping links and private data before producing a manifest',async t=>{
 const root=await fixture(t);await symlink('../../../../',path.join(root,'tools/payload-admin/escape'));await assert.rejects(cmsArtifactFiles(root),/escapes/);await rm(path.join(root,'tools/payload-admin/escape'));
 await writeFile(path.join(root,'tools/payload-admin/cms.db'),'private');await assert.rejects(cmsArtifactFiles(root),/allowlist/);
});
test('platform-native binary proof rejects foreign modules; production cannot use a Mac fixture artifact',async t=>{
 const root=await fixture(t);await manifest(root);if(process.platform!=='linux')await assert.rejects(verifyCMSArtifact(root),/platform/);
 await mkdir(path.join(root,'node_modules/native'),{recursive:true});await writeFile(path.join(root,'node_modules/native/module.node'),'not a platform native module');await assert.rejects(cmsArtifactFiles(root),/native module platform/);
});

test('environment file variants cannot enter a signed CMS code artifact',async t=>{
 const root=await fixture(t);for(const name of ['.env','.env.production','.env.production.local','.env.example']){const file=path.join(root,'tools/payload-admin',name);await writeFile(file,'synthetic fixture only');await assert.rejects(cmsArtifactFiles(root),/allowlist/);await rm(file);}
});
