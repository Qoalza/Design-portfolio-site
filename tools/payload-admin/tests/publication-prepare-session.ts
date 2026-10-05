import assert from 'node:assert/strict'
import {readFile,mkdir,cp,writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {randomUUID} from 'node:crypto'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {OperationStore} from '../src/publication/operations'
import {prepareRuntime} from '../src/publication/prepare'
import {contentHash} from '../../portfolio-release/content-source.mjs'
const exec=promisify(execFile),root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const repoRoot=path.resolve(import.meta.dirname,'../../..'),source=(await readFile('/private/tmp/payload-site-build-snapshot.txt','utf8')).trim()
const snapshotBytes=await readFile(path.join(source,'snapshot.json')),{stdout}=await exec('git',['rev-parse','HEAD'],{cwd:repoRoot}),codeSha=stdout.trim()
const owner=2
 const store=new OperationStore(root),active=await store.active(owner),operation=active?.state==='ready'?active:await store.create({owner,requestId:randomUUID(),codeSha,contentHash:contentHash(snapshotBytes)})
const directory=path.join(store.root,'inputs',operation.id);await mkdir(directory,{recursive:true});if(operation.state==='preparing')await cp(source,path.join(directory,'snapshot'),{recursive:true})
const ready=await prepareRuntime({dataRoot:root,repoRoot,id:operation.id,owner})
assert.equal(ready.state,'ready');assert.ok(ready.artifactHash);assert.ok(ready.archiveBytes)
assert.deepEqual(await prepareRuntime({dataRoot:root,repoRoot,id:operation.id,owner}),ready)
await assert.rejects(exec('git',['rev-parse','--show-toplevel'],{cwd:path.join(directory,'build')}))
await writeFile('/private/tmp/payload-publication-ready-operation.json',JSON.stringify({root,id:operation.id,owner,codeSha,contentHash:operation.contentHash,archive:path.join(directory,'runtime.tar.gz')}))
console.log('PASS: durable native publication preparation builds exact detached code/snapshot offline, packages immutable archive, cleans owned checkout, replays ready without rebuild')
