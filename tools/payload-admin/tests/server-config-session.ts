import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
const root=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-test-server-config-'))
try{
 delete process.env.PAYLOAD_LOCAL_ROOT
 Object.assign(process.env,{PAYLOAD_RUNTIME_MODE:'server',PAYLOAD_DATA_ROOT:path.join(root,'data'),PAYLOAD_PUBLIC_URL:'https://art-des.ru',PAYLOAD_SECRET:'a'.repeat(96)})
 const {default:config}=await import('../src/payload.config')
 const value=await config
 assert.equal(value.serverURL,'https://art-des.ru')
 assert.ok(value.csrf.includes('https://art-des.ru'))
 const users=value.collections.find(collection=>collection.slug==='users')!
 assert.ok(users.auth);assert.equal(users.auth.cookies.secure,true);assert.equal(users.auth.cookies.sameSite,'Lax')
 for(const name of ['media','project-files'])assert.equal(value.collections.find(collection=>collection.slug===name)!.upload.staticDir,path.join(root,'data',name))
 assert.equal(value.admin.meta.titleSuffix,'— Des-art Payload')
 console.log('PASS: sanitized installed Payload config uses server HTTPS, secure same-site authentication and permanent upload root')
}finally{await rm(root,{recursive:true,force:true})}
