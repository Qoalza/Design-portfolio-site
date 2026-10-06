import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import {randomUUID} from 'node:crypto'
import {createLocalReq,type Payload,type PayloadRequest} from 'payload'
import type {User} from '../src/payload-types'
import {authorizePublication} from '../src/publication/guard'
// Lower-level native schema/version tests only. This helper is never imported by
// runtime code and cannot be used against development or permanent CMS storage.
// It does not constitute public delivery or relax the real coordinator tests.
export async function nativeSchemaFixture<T>(payload:Payload,user:User,target:number,operation:'publish'|'delete',mutate:(req:PayloadRequest)=>Promise<T>) {
 const root=process.env.PAYLOAD_LOCAL_ROOT!
 assert.equal(process.env.PAYLOAD_RUNTIME_MODE,'fixture')
 assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()))
 assert.match(path.basename(root),/^des-art-payload-test-/)
 const req=await createLocalReq({user},payload),digest='0'.repeat(64)
 const revoke=authorizePublication(req,{operationId:randomUUID(),actor:String(user.id),target:String(target),operation,expectedRevision:digest,sourceDigest:digest},{selectedRevision:'schema-fixture',sourceDigest:digest})
 try{return await mutate(req)}finally{revoke()}
}
