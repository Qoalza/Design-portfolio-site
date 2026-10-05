import test from 'node:test'
import assert from 'node:assert/strict'
import {serverWriteDenial} from '../src/server-request'
test('online native writes require approved Origin/Host and reject first registration',()=>{
 const previous={...process.env}
 try{
  delete process.env.PAYLOAD_LOCAL_ROOT
  Object.assign(process.env,{PAYLOAD_RUNTIME_MODE:'server',PAYLOAD_DATA_ROOT:'/var/lib/art-des-payload',PAYLOAD_PUBLIC_URL:'https://art-des.ru'})
  const request=(headers:HeadersInit)=>new Request('http://127.0.0.1:3000/api/projects',{method:'POST',headers})
  assert.equal(serverWriteDenial(request({Origin:'https://art-des.ru',Host:'art-des.ru'}),['projects']),null)
  const rejected:HeadersInit[]=[{},{Origin:'https://evil.example',Host:'art-des.ru'},{Origin:'https://art-des.ru',Host:'evil.example'}]
  for(const headers of rejected)assert.equal(serverWriteDenial(request(headers),['projects'])?.status,403)
  assert.equal(serverWriteDenial(request({Origin:'https://art-des.ru',Host:'art-des.ru'}),['users','first-register'])?.status,403)
 }finally{for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous)}
})
