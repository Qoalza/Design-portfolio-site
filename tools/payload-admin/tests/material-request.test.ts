import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readMaterialForm} from '../src/materials/request'
const origin='http://127.0.0.1:41741'
function request(form:FormData, extra:Record<string,string>={}){return new Request(origin+'/api/materials/images',{method:'POST',headers:{origin,host:'127.0.0.1:41741',...extra},body:form})}
test('bounded authenticated-origin transport reads one multipart image without manual public paths',async()=>{
 const form=new FormData();form.set('file',new File([Buffer.from('fixture')],'file.png'));form.set('projectId','1')
 const parsed=await readMaterialForm(request(form),origin)
 assert.equal(parsed.get('projectId'),'1');assert.equal((parsed.get('file')as File).name,'file.png')
})
test('foreign origin, host and oversized streamed or declared bodies are rejected',async()=>{
 const form=new FormData();form.set('file',new File([Buffer.alloc(1024)],'fixture.png'))
 await assert.rejects(readMaterialForm(request(form,{origin:'https://external.example'}),origin),error=>error instanceof Error&&'status' in error&&error.status===403)
 await assert.rejects(readMaterialForm(request(form,{host:'external.example'}),origin),error=>error instanceof Error&&'status' in error&&error.status===403)
 await assert.rejects(readMaterialForm(request(form,{'content-length':'999999999'}),origin),/превышает/)
 await assert.rejects(readMaterialForm(request(form),origin,100),/превышает/)
})
