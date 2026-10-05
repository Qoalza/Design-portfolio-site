import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {readPublishedSiteAsset} from '../src/site/read-assets'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {readPublishedSiteContent} from '../src/site/read-content'
const root=path.resolve(process.env.PAYLOAD_LOCAL_ROOT||'')
assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const {getPayload}=await import('payload'),{default:config}=await import('../src/payload.config')
const payload=await getPayload({config})
try{
 const user=(await payload.find({collection:'users',where:{email:{equals:'editor@example.test'}}})).docs[0],access={user,overrideAccess:false}
 const baseline=await payload.findByID({collection:'projects',id:2,...access,draft:false})
 const before=await readPublishedSiteContent(payload)
 const build=await readFile('.next/BUILD_ID','utf8')
 try{
  const content=structuredClone(baseline.releaseContent) as {redesign:{card:{preview:{back:{src:string}}}}}
  content.redesign.card.preview.back.src='/assets/projects/'+baseline.slug+'/uploads/'+'a'.repeat(64)+'.png'
  await payload.update({collection:'projects',id:2,...access,draft:true,data:{title:'Не применять отсутствующий ресурс',releaseContent:content,_status:'draft'}})
  assert.deepEqual(await readPublishedSiteContent(payload),before)
  await assert.rejects(payload.update({collection:'projects',id:2,...access,data:{title:'Не применять отсутствующий ресурс',releaseContent:content,_status:'published'}}),/материал|ресурс/i)
  assert.deepEqual(await readPublishedSiteContent(payload),before)
  const bytes=await sharp({create:{width:2,height:2,channels:4,background:'#739aca'}}).png().toBuffer()
  const media=await payload.create({collection:'media',...access,data:{alt:'Online fixture'},file:{name:'online.png',mimetype:'image/png',data:bytes,size:bytes.length}})
  const publicPath='/assets/projects/'+baseline.slug+'/uploads/'+createHash('sha256').update(bytes).digest('hex')+'.png'
  const valid=structuredClone(baseline.releaseContent) as {redesign:{card:{preview:{back:{src:string;width:number;height:number}}}}}
  Object.assign(valid.redesign.card.preview.back,{src:publicPath,width:2,height:2})
  const releaseAssets=[...(baseline.releaseAssets??[]),{publicPath,file:{relationTo:'media' as const,value:media.id}}]
  await payload.update({collection:'projects',id:2,...access,draft:true,data:{releaseContent:valid,releaseAssets,_status:'draft'}})
  assert.equal(await readPublishedSiteAsset(payload,root,publicPath),null)
  await payload.update({collection:'projects',id:2,...access,data:{releaseContent:valid,releaseAssets,_status:'published'}})
  assert.deepEqual((await readPublishedSiteAsset(payload,root,publicPath))!.content,bytes)
  const renamed='online-renamed-fixture'
  await payload.update({collection:'projects',id:2,...access,data:{slug:renamed,_status:'published'}})
  assert.equal(await readPublishedSiteAsset(payload,root,publicPath),null)
  assert.deepEqual((await readPublishedSiteAsset(payload,root,publicPath.replace('/'+baseline.slug+'/','/'+renamed+'/')))!.content,bytes)
  assert.equal(await readFile('.next/BUILD_ID','utf8'),build)
 }finally{await payload.update({collection:'projects',id:2,...access,data:{title:baseline.title,slug:baseline.slug,releaseContent:baseline.releaseContent,releaseAssets:baseline.releaseAssets,_status:'published'}})}
 console.log('PASS: incomplete draft allowed; missing asset rejects before commit; draft upload private; native Publish serves exact new bytes without build; slug aliases follow publication; fixture restored')
}finally{await payload.destroy()}
