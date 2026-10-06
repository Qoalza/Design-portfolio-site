import assert from 'node:assert/strict'
import {GET} from '../src/app/(payload)/api/internal/cms-health/route'
import {runtimeSettings} from '../scripts/runtime-settings.mjs'
const settings=runtimeSettings(),host=`127.0.0.1:${settings.port}`
assert.equal(process.env.PAYLOAD_CMS_BUILD_ID,undefined)
// Actual Next standalone normalizes Request.url to localhost; keep the exact
// loopback transport host check and fail closed until build/writer proof exists.
assert.equal((await GET(new Request(`http://localhost:${settings.port}/api/internal/cms-health`,{headers:{host}}))).status,503)
const deniedHeaders:Record<string,string>[]=[{host:'art-des.ru'},{host,'x-forwarded-host':'art-des.ru'},{host,'x-forwarded-proto':'https'}]
for(const headers of deniedHeaders)assert.equal((await GET(new Request(settings.origin+'/api/internal/cms-health',{headers}))).status,403)
console.log('PASS: CMS health uses exact loopback transport host and rejects public proxy identities')
