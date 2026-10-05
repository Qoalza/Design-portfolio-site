import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const origin='http://127.0.0.1:41741'
const login=await fetch(`${origin}/api/users/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.test',password:'Disposable-Editor-Fixture-2026!'})})
assert.equal(login.status,200)
const {token}=await login.json() as {token:string}
const headers={Authorization:`JWT ${token}`}
const collection=await fetch(`${origin}/api/project-files?where[mimeType][equals]=text/html&limit=1`,{headers})
assert.equal(collection.status,200)
assert.equal(collection.headers.get('Content-Disposition'),null)
const {docs}=await collection.json() as {docs:{filename:string}[]}
assert.ok(docs.length)
const filename=docs[0].filename
assert.equal(path.basename(filename),filename)
const expected=await readFile(path.join(root,'project-files',filename))
for(const prefix of ['project-files','project%2dfiles']) {
 const url=`${origin}/api/${prefix}/file/${encodeURIComponent(filename)}`
 const anonymous=await fetch(url)
 assert.ok(anonymous.status===401||anonymous.status===403)
 const response=await fetch(url,{headers})
 assert.equal(response.status,200)
 assert.equal(response.headers.get('Content-Disposition'),'attachment')
 assert.equal(response.headers.get('Content-Security-Policy'),"sandbox; default-src 'none'; base-uri 'none'; form-action 'none'")
 assert.equal(response.headers.get('Cache-Control'),'private, no-store')
 assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff')
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected)
 const head=await fetch(url,{method:'HEAD',headers})
 assert.equal(head.status,200)
 assert.equal(head.headers.get('Content-Disposition'),'attachment')
 assert.equal((await head.arrayBuffer()).byteLength,0)
}
console.log('PASS: native file GET/HEAD and encoded collection apply download/sandbox policy; anonymous denied, authenticated bytes unchanged, collection JSON unaffected')
