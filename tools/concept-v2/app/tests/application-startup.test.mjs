import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationStartup} from '../src/application-startup.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const signal=()=>new AbortController();

test('execution failure is retried at a fresh module URL and successful mount is reusable',async()=>{
 const urls=[];let mounts=0,disposed=0;
 const startup=createApplicationStartup({entry:'http://localhost/src/main.jsx',load:async url=>{urls.push(url);if(urls.length===1)throw new Error('execution failed');return {mountApplication(){mounts++;return()=>disposed++;}};}});
 await assert.rejects(startup.ensure(signal().signal,0),/execution failed/);
 await startup.ensure(signal().signal,1);await startup.ensure(signal().signal,2);
 assert.equal(urls.length,2);assert.match(urls[1],/preloader-attempt=1/);assert.equal(mounts,1);
 startup.dispose();assert.equal(disposed,1);
});
test('a cancelled import cannot mount late; new attempt loads independently',async()=>{
 const pending=deferred(),mounted=[];let requests=0;
 const startup=createApplicationStartup({entry:'http://localhost/app.js',load:()=>++requests===1?pending.promise:Promise.resolve({mountApplication(){mounted.push('new');return()=>{};}})});
 const previous=signal(),old=startup.ensure(previous.signal,0);previous.abort();
 await assert.rejects(old,{name:'AbortError'});await startup.ensure(signal().signal,1);
 pending.resolve({mountApplication(){mounted.push('stale');return()=>{};}});await Promise.resolve();await Promise.resolve();
 assert.deepEqual(mounted,['new']);startup.dispose();
});
test('uncaught render failure rejects readiness and disposes root before remount',async()=>{
 const events=[];let fail;
 const startup=createApplicationStartup({entry:'http://localhost/app.js',load:async()=>({mountApplication({onError}){fail=onError;events.push('mount');return()=>events.push('dispose');}})});
 const instance=await startup.ensure(signal().signal,0);fail(new Error('render failed'));
 await assert.rejects(instance.failure,/render failed/);await startup.ensure(signal().signal,1);
 assert.deepEqual(events,['mount','dispose','mount']);startup.dispose();
});
test('permanent failure fails every real attempt and attempt IDs do not cap at copy variant two',async()=>{
 const urls=[];const startup=createApplicationStartup({entry:'http://localhost/app.js',load:async url=>{urls.push(url);throw new Error('broken');}});
 for(let id=0;id<5;id++)await assert.rejects(startup.ensure(signal().signal,id),/broken/);
 assert.equal(new Set(urls).size,5);assert.match(urls[4],/preloader-attempt=4/);startup.dispose();
});
