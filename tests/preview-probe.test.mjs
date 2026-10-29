import test from 'node:test';
import assert from 'node:assert/strict';
import {createReleaseHandler} from '../tools/portfolio-release/release-host.mjs';
import {previewProbePath} from '../tools/portfolio-release/preview-probe.mjs';
test('diagnostic HTML works without app files or CMS and contains only text metadata',async()=>{
 const handler=createReleaseHandler({root:'/nonexistent-preview-probe-root',readState:async()=>{throw new Error('Must not read CMS');}});
 const response=await handler(new Request('https://art-des.ru'+previewProbePath));
 assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/html; charset=utf-8');
 const html=await response.text();assert.equal(Number(response.headers.get('content-length')),Buffer.byteLength(html));
 assert.ok(Buffer.byteLength(html)<1500);assert.doesNotMatch(html,/<script|<style|preloader|portfolio-projects/);
 assert.doesNotMatch(html,/og:image|twitter:image|<img|<link/);
 assert.match(html,/og:title/);assert.match(html,/og:description/);assert.match(html,/preview-text-20261029/);
 const head=await handler(new Request('https://art-des.ru'+previewProbePath,{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('content-length'),response.headers.get('content-length'));
 const post=await handler(new Request('https://art-des.ru'+previewProbePath,{method:'POST'}));assert.equal(post.status,405);
});
