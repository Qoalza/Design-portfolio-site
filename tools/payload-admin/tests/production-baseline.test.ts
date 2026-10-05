import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm,symlink} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {exportApprovedRedesign} from '../../concept-v2/export-approved-content.mjs'
import {writeSnapshotDirectory} from '../../portfolio-release/snapshot-directory.mjs'
import {readDeployedSiteBaseline,readLegacyDeployedSiteBaseline} from '../scripts/production-baseline.mjs'
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex')
test('production baseline requires exact release identity and rejects altered assets/symlinks without writing',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-production-baseline-'))
 try{
  const site=path.join(root,'site'),prepared=await exportApprovedRedesign({repoRoot:path.resolve(import.meta.dirname,'../../..')})
  await writeSnapshotDirectory(site,prepared)
  const snapshot=await readFile(path.join(site,'snapshot.json')),sha='a'.repeat(40),contentHash=hash(snapshot)
  const manifest={version:1,buildSha:sha,sourceDirty:false,snapshotSha256:contentHash,provenance:prepared.provenance,files:prepared.assets.map(asset=>({path:asset.publicPath.slice(1),bytes:asset.bytes.length,sha256:asset.sha256}))}
  const manifestFile=path.join(site,'site-manifest.json'),save=()=>writeFile(manifestFile,JSON.stringify(manifest))
  await save()
  const baseline=await readDeployedSiteBaseline({root:site,expectedSha:sha,expectedContentHash:contentHash})
  assert.deepEqual(baseline.projects,prepared.projects);assert.equal(baseline.assets.length,prepared.assets.length)
  assert.deepEqual(await readFile(path.join(site,'snapshot.json')),snapshot)
  await assert.rejects(readDeployedSiteBaseline({root:site,expectedSha:'b'.repeat(40),expectedContentHash:contentHash}),/identity/)
  await assert.rejects(readDeployedSiteBaseline({root:site,expectedSha:sha,expectedContentHash:'b'.repeat(64)}),/identity|digest/)
  manifest.sourceDirty=true;await save();await assert.rejects(readDeployedSiteBaseline({root:site,expectedSha:sha,expectedContentHash:contentHash}),/identity/)
  manifest.sourceDirty=false;manifest.files[0].sha256='f'.repeat(64);await save();await assert.rejects(readDeployedSiteBaseline({root:site,expectedSha:sha,expectedContentHash:contentHash}),/asset manifest/)
  manifest.files[0].sha256=prepared.assets[0].sha256;await save()
  const legacy={...manifest,snapshotSha256:undefined}
  await writeFile(manifestFile,JSON.stringify(legacy))
  const recovered=await readLegacyDeployedSiteBaseline({root:site,expectedSha:sha,repoRoot:path.resolve(import.meta.dirname,'../../..')})
  assert.deepEqual(recovered.projects,prepared.projects);assert.equal(recovered.assets.length,prepared.assets.length)
  await writeFile(manifestFile,JSON.stringify({...legacy,provenance:{...legacy.provenance,sourceSha:'f'.repeat(40)}}))
  await assert.rejects(readLegacyDeployedSiteBaseline({root:site,expectedSha:sha,repoRoot:path.resolve(import.meta.dirname,'../../..')}),/provenance/)
  await save()
  const asset=prepared.assets[0],file=path.join(site,asset.publicPath.slice(1));await writeFile(file,Buffer.alloc(asset.bytes.length))
  await assert.rejects(readDeployedSiteBaseline({root:site,expectedSha:sha,expectedContentHash:contentHash}),/checksum/)
  await writeFile(file,asset.bytes)
  await rm(path.join(site,'snapshot.json'));await symlink(file,path.join(site,'snapshot.json'))
  await assert.rejects(readDeployedSiteBaseline({root:site,expectedSha:sha,expectedContentHash:contentHash}),/symlink/)
 }finally{await rm(root,{recursive:true,force:true})}
})
