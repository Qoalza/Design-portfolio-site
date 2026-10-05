import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {randomUUID} from 'node:crypto'
import {OperationStore,validateOperation} from '../src/publication/operations'
test('durable single publication, idempotent replay, exact artifact and unknown-result protection',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-test-publication-'))
 try{
  const store=new OperationStore(root),request={owner:1,requestId:randomUUID(),codeSha:'a'.repeat(40),contentHash:'b'.repeat(64)}
  const created=await store.create(request)
  assert.equal((await new OperationStore(root).create(request)).id,created.id)
  await assert.rejects(store.create({...request,contentHash:'c'.repeat(64)}),/content changed/)
  await assert.rejects(store.create({...request,requestId:randomUUID()}),/already active/)
  await assert.rejects(store.read(created.id,2),/unavailable/)
  await assert.rejects(store.transition(created.id,1,'preparing','complete'),/state conflict/)
  await store.transition(created.id,1,'preparing','ready',{artifactHash:'d'.repeat(64),archiveBytes:100})
  await assert.rejects(store.transition(created.id,1,'ready','uploading',{artifactHash:'e'.repeat(64)}),/immutable/)
  await store.transition(created.id,1,'ready','uploading')
  await store.transition(created.id,1,'uploading','starting')
  const serverOperationId=request.codeSha+'-'+'d'.repeat(16)
  await store.transition(created.id,1,'starting','unknown',{serverOperationId,errorCode:'START_RESULT_UNKNOWN'})
  await assert.rejects(new OperationStore(root).create({...request,requestId:randomUUID()}),/already active/)
  await assert.rejects(store.transition(created.id,1,'unknown','uploading'),/state conflict/)
  await store.transition(created.id,1,'unknown','deploying')
  await store.transition(created.id,1,'deploying','verifying')
  await store.transition(created.id,1,'verifying','complete')
  assert.equal((await new OperationStore(root).read(created.id,1)).serverOperationId,serverOperationId)
  const other=await store.create({...request,owner:2,requestId:randomUUID()});assert.equal(other.owner,2)
  await assert.rejects(store.create({...request,requestId:randomUUID()}),/already active/)
  await store.transition(other.id,2,'preparing','failed',{errorCode:'CANCELED'})
  const second=await store.create({...request,requestId:randomUUID()});assert.notEqual(second.id,created.id)
  assert.equal((await new OperationStore(root).create(request)).id,created.id)
  assert.throws(()=>validateOperation({...created,serverOperationId:'forged'}),/identity/)
  assert.throws(()=>validateOperation({...created,keyPath:'/private/key'}),/Unknown/)
 }finally{await rm(root,{recursive:true,force:true})}
})

test('concurrent callers reserve only one publication',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-test-publication-'))
 try{
  const request={owner:1,codeSha:'a'.repeat(40),contentHash:'b'.repeat(64)}
  const results=await Promise.allSettled([new OperationStore(root).create({...request,requestId:randomUUID()}),new OperationStore(root).create({...request,requestId:randomUUID()})])
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1)
 }finally{await rm(root,{recursive:true,force:true})}
})
