import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {randomUUID} from 'node:crypto'
import {OperationStore} from '../src/publication/operations'
import {dispatchPreparation} from '../src/publication/service'
import {runCommand} from '../src/publication/command'

test('failed publication directory setup terminates the reserved operation and permits a new request',async()=>{
 const dataRoot=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-test-setup-'))
 try{
  const store=new OperationStore(dataRoot),request={requestId:randomUUID(),owner:1,codeSha:'a'.repeat(40),contentHash:'b'.repeat(64)}
  const operation=await store.create(request)
  await writeFile(path.join(store.root,'inputs'),'blocked')
  await assert.rejects(dispatchPreparation({store,operation,dataRoot,repoRoot:dataRoot,writeSnapshot:async()=>{assert.fail('must fail before reading content')}}),/Не удалось/)
  assert.equal((await store.read(operation.id,1)).state,'failed')
  assert.equal((await store.forRequest(request.requestId,1))?.id,operation.id)
  assert.notEqual((await store.create({...request,requestId:randomUUID()})).id,operation.id)
 }finally{await rm(dataRoot,{recursive:true,force:true})}
})
test('timed out build terminates a surviving descendant before checkout cleanup',async()=>{
 const cwd=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-test-command-'))
 try{
  const descendant="process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"
  const parent=`const {spawn}=require('node:child_process');const c=spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:'ignore'});require('node:fs').writeFileSync('pid',String(c.pid));setInterval(()=>{},1000)`
  await assert.rejects(runCommand(process.execPath,['-e',parent],{cwd,timeout:1000,maxBuffer:4096}),/deadline/)
  const pid=Number(await readFile(path.join(cwd,'pid'),'utf8'))
  // SIGKILL is delivered before the command rejects; let the OS reap the child.
  let alive=true
  for(let i=0;i<100&&alive;i++){try{process.kill(pid,0);await new Promise(resolve=>setTimeout(resolve,10))}catch(error){assert.equal((error as NodeJS.ErrnoException).code,'ESRCH');alive=false}}
  assert.equal(alive,false)
  assert.equal((await runCommand(process.execPath,['-e',"process.stdout.write('ok')"],{cwd,timeout:1000,maxBuffer:4096})).stdout,'ok')
 }finally{await rm(cwd,{recursive:true,force:true})}
})
