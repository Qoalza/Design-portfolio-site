import test from 'node:test'
import assert from 'node:assert/strict'
import {readPublicationRequest} from '../src/publication/request'
const origin='http://127.0.0.1:41741'
const request=(body:string,headers:Record<string,string>={})=>new Request(origin+'/api/site-publication/prepare',{method:'POST',headers:{Origin:origin,Host:'127.0.0.1:41741','Content-Type':'application/json',...headers},body})
test('publication JSON guard binds origin/host and actual body limits',async()=>{
 assert.deepEqual(await readPublicationRequest(request('{"requestId":"fixture"}'),origin),{requestId:'fixture'})
 await assert.rejects(readPublicationRequest(request('{}',{Origin:'https://foreign.test'}),origin),/Payload/)
 await assert.rejects(readPublicationRequest(request('{}',{Host:'foreign.test'}),origin),/Payload/)
 await assert.rejects(readPublicationRequest(request('{}',{'Content-Length':'99999'}),origin),/большой/)
 await assert.rejects(readPublicationRequest(request(' '.repeat(4097),{'Content-Length':'2'}),origin),/большой/)
 await assert.rejects(readPublicationRequest(request('[]'),origin),/Неверный/)
 await assert.rejects(readPublicationRequest(request('{'),origin),/прочитать/)
})
