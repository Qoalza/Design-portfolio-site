import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import { prepareImage } from '../src/materials/image-quality'

async function screen() {
 const pixels=Buffer.alloc(128*128*4)
 for(let n=0;n<128*128;n++) { pixels[n*4]=(n%128<64?255:0);pixels[n*4+1]=n%7?30:200;pixels[n*4+2]=100;pixels[n*4+3]=n%11?255:120 }
 return sharp(pixels,{raw:{width:128,height:128,channels:4}}).png({compressionLevel:0}).toBuffer()
}
test('screen ingest chooses smaller verified lossless bytes without resizing or changing RGBA',async()=>{
 const original=await screen(), prepared=await prepareImage(original,'screen')
 assert.equal(prepared.report.reason,'verified-lossless')
 assert.equal(prepared.report.mode,'lossless')
 assert.ok(prepared.bytes.length<original.length)
 assert.deepEqual(await sharp(prepared.bytes).ensureAlpha().raw().toBuffer(),await sharp(original).ensureAlpha().raw().toBuffer())
 assert.equal(prepared.report.prepared.width,128);assert.equal(prepared.report.prepared.height,128)
 assert.equal(prepared.report.original.bytes,original.length)
 assert.notEqual(prepared.report.prepared.sha256,prepared.report.original.sha256)
})
test('unknown context preserves the full original and does not invoke an encoder',async()=>{
 const original=await screen()
 const prepared=await prepareImage(original,'unknown',{encode:async()=>{throw new Error('must not encode')}})
 assert.deepEqual(prepared.bytes,original)
 assert.equal(prepared.report.reason,'original-context-unknown')
})
test('encoding failure and a candidate that is not smaller preserve original bytes',async()=>{
 const original=await screen()
 const failed=await prepareImage(original,'screen',{encode:async()=>{throw new Error('failure')}})
 assert.deepEqual(failed.bytes,original);assert.equal(failed.report.reason,'original-encoding-failed')
 const inflated=Buffer.concat([await sharp(original).webp({lossless:true}).toBuffer(),Buffer.alloc(original.length)])
 const larger=await prepareImage(original,'screen',{encode:async()=>inflated})
 assert.deepEqual(larger.bytes,original);assert.equal(larger.report.reason,'original-not-smaller')
})
test('lossy, resized and damaged candidates are rejected without losing original',async()=>{
 const original=await screen()
 for(const candidate of [await sharp(original).webp({quality:10}).toBuffer(),await sharp(original).resize(64,64).webp({lossless:true}).toBuffer(),Buffer.from('broken')]) {
  const prepared=await prepareImage(original,'screen',{encode:async()=>candidate})
  assert.deepEqual(prepared.bytes,original)
  assert.equal(prepared.report.reason,'original-quality-mismatch')
 }
})
test('existing WebP is not compressed again; colour profile and JPEG orientation are preserved',async()=>{
 const original=await screen()
 const webp=await sharp(original).webp({lossless:true}).toBuffer()
 const repeated=await prepareImage(webp,'screen')
 assert.deepEqual(repeated.bytes,webp);assert.equal(repeated.report.reason,'original-already-webp')
 const profiled=await sharp(original).withIccProfile('p3').png({compressionLevel:0}).toBuffer()
 const colour=await prepareImage(profiled,'screen')
 assert.deepEqual((await sharp(colour.bytes).metadata()).icc,(await sharp(profiled).metadata()).icc)
 const jpeg=await sharp(original).withMetadata({orientation:6}).jpeg().toBuffer()
 const photo=await prepareImage(jpeg,'photo')
 assert.deepEqual(photo.bytes,jpeg);assert.equal((await sharp(photo.bytes).metadata()).orientation,6)
})
test('invalid originals are refused rather than disguised as safe fallback',async()=>{
 await assert.rejects(prepareImage(Buffer.from('invalid'),'screen'))
 const png=await screen()
 await assert.rejects(prepareImage(png.subarray(0,70),'screen'))
 await assert.rejects(prepareImage(Buffer.alloc(21*1024*1024),'screen'))
})
