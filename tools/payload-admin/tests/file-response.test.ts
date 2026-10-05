import assert from 'node:assert/strict'
import {test} from 'node:test'
import {protectProjectFileResponse} from '../src/materials/file-response'
test('native HTML downloads cannot execute in CMS origin; bytes and status survive',async()=>{
 const bytes='<html><script>window.parent</script></html>'
 const source=new Response(bytes,{headers:{'Content-Type':'text/html','Content-Length':String(bytes.length)}})
 const secured=protectProjectFileResponse(source,['project-files','file','layout.html'])
 assert.equal(secured.headers.get('Content-Disposition'),'attachment')
 assert.equal(secured.headers.get('Content-Security-Policy'),"sandbox; default-src 'none'; base-uri 'none'; form-action 'none'")
 assert.equal(secured.headers.get('Cache-Control'),'private, no-store')
 assert.equal(secured.headers.get('X-Content-Type-Options'),'nosniff')
 assert.equal(secured.headers.get('Content-Length'),String(bytes.length))
 assert.equal(await secured.text(),bytes)
 const denied=protectProjectFileResponse(new Response('Denied',{status:401}),['project-files','file','layout.html'])
 assert.equal(denied.status,401)
})
test('collection JSON, native media, preview and other routes retain their responses',()=>{
 for(const slug of [undefined,['projects','1'],['project-files','1'],['media','file','screen.webp'],['preview']]) {
  const response=new Response('unchanged')
  assert.equal(protectProjectFileResponse(response,slug),response)
 }
})
