import test from 'node:test';
import assert from 'node:assert/strict';
import {createReleaseHandler} from '../tools/portfolio-release/release-host.mjs';
import {previewProbePath} from '../tools/portfolio-release/preview-probe.mjs';
test('diagnostic HTML works without app files or CMS and declares one original cover',async()=>{
 const handler=createReleaseHandler({root:'/nonexistent-preview-probe-root',readState:async()=>{throw new Error('Must not read CMS');}});
 const response=await handler(new Request('https://art-des.ru'+previewProbePath));
 assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/html; charset=utf-8');
 const html=await response.text();assert.equal(Number(response.headers.get('content-length')),Buffer.byteLength(html));
 assert.ok(Buffer.byteLength(html)<1500);assert.doesNotMatch(html,/<script|<style|preloader|portfolio-projects/);
 assert.equal((html.match(/property="og:image"/g)||[]).length,1);
 assert.match(html,/https:\/\/art-des.ru\/artur-designer-social-preview-v3.png/);
 const head=await handler(new Request('https://art-des.ru'+previewProbePath,{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('content-length'),response.headers.get('content-length'));
 const post=await handler(new Request('https://art-des.ru'+previewProbePath,{method:'POST'}));assert.equal(post.status,405);
});
