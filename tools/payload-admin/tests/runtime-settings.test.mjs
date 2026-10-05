import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import os from 'node:os';
import {runtimeSettings} from '../scripts/runtime-settings.mjs';
const appRoot='/srv/art-des/code/tools/payload-admin';
test('online runtime explicitly uses permanent external data, HTTPS origin and private loopback port',()=>{
 const env={PAYLOAD_RUNTIME_MODE:'server',PAYLOAD_DATA_ROOT:'/var/lib/art-des-payload',PAYLOAD_PUBLIC_URL:'https://art-des.ru'};
 assert.deepEqual(runtimeSettings({env,appRoot}),{mode:'server',server:true,fixture:false,root:'/var/lib/art-des-payload',port:3000,origin:'https://art-des.ru'});
 for(const change of [{PAYLOAD_DATA_ROOT:''},{PAYLOAD_DATA_ROOT:'relative'},{PAYLOAD_DATA_ROOT:'/var/lib/data?uri'},{PAYLOAD_DATA_ROOT:appRoot+'/data'},{PAYLOAD_DATA_ROOT:'/var/www/art-des/media'},{PAYLOAD_PUBLIC_URL:'http://art-des.ru'},{PAYLOAD_PUBLIC_URL:'https://evil.example'},{PAYLOAD_PUBLIC_URL:'https://art-des.ru/path'},{PAYLOAD_PORT:'0'},{PAYLOAD_LOCAL_ROOT:'/tmp/sandbox'}])assert.throws(()=>runtimeSettings({env:{...env,...change},appRoot}));
});
test('fixture and development modes stay explicit and isolated from server roots',()=>{
 const root=path.join(os.tmpdir(),'des-art-payload-test-settings');
 assert.equal(runtimeSettings({env:{PAYLOAD_LOCAL_ROOT:root},appRoot}).mode,'fixture');
 assert.equal(runtimeSettings({env:{PAYLOAD_RUNTIME_MODE:'fixture',PAYLOAD_LOCAL_ROOT:root},appRoot}).origin,'http://127.0.0.1:41741');
 assert.throws(()=>runtimeSettings({env:{PAYLOAD_RUNTIME_MODE:'fixture'},appRoot}));
 assert.throws(()=>runtimeSettings({env:{PAYLOAD_RUNTIME_MODE:'unknown'},appRoot}));
 assert.throws(()=>runtimeSettings({env:{PAYLOAD_DATA_ROOT:'/var/lib/art-des-payload'},appRoot}));
 assert.throws(()=>runtimeSettings({env:{PAYLOAD_LOCAL_ROOT:'/tmp/unapproved'},appRoot}));
});
