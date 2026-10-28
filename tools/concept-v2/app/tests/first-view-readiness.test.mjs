import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareFirstView} from '../src/first-view-readiness.mjs';
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(setImmediate);};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function fixture(t,images=[],fonts=()=>Promise.resolve()){
 const previous={document:globalThis.document,location:globalThis.location,innerHeight:globalThis.innerHeight,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 Object.assign(globalThis,{document:{fonts:{load:fonts,forEach(){}},styleSheets:[]},location:{href:'http://localhost/'},innerHeight:800,requestAnimationFrame:fn=>setImmediate(fn),cancelAnimationFrame:clearImmediate});
 t.after(()=>{for(const [key,value] of Object.entries(previous))if(value===undefined)delete globalThis[key];else globalThis[key]=value;});
 return {querySelectorAll:()=>images};
}
function image({complete=false,naturalWidth=0,loading='eager',top=0,decode=()=>Promise.resolve()}={}){
 const listeners=new Map();return {src:'http://localhost/hero.png',complete,naturalWidth,loading,decode,listeners,getBoundingClientRect:()=>({top}),addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key),loaded(){this.complete=true;this.naturalWidth=100;listeners.get('load')?.();}};
}
test('retry starts a fresh pending image request; cancellation removes listeners',async t=>{
 const picture=image(),root=fixture(t,[picture]),controller=new AbortController();
 const pending=prepareFirstView(root,controller.signal,7);await settle();
 assert.match(picture.src,/preloader-retry=7/);controller.abort();await assert.rejects(pending,{name:'AbortError'});assert.equal(picture.listeners.size,0);
});
test('lazy and below-viewport images never block a usable first view',async t=>{
 const lazy=image({loading:'lazy'}),below=image({top:900}),ready=image({complete:true,naturalWidth:100});
 await prepareFirstView(fixture(t,[lazy,below,ready]),new AbortController().signal);
 assert.equal(lazy.listeners.size,0);assert.equal(below.listeners.size,0);
});
test('font wait can be detached immediately from an abandoned attempt',async t=>{
 const font=deferred(),root=fixture(t,[],()=>font.promise),controller=new AbortController();
 const pending=prepareFirstView(root,controller.signal);await settle();controller.abort();await assert.rejects(pending,{name:'AbortError'});font.resolve();
});
test('a failed image is a real error and recovers through a fresh request',async t=>{
 const picture=image({complete:true}),root=fixture(t,[picture]);
 await assert.rejects(prepareFirstView(root,new AbortController().signal),/Critical first-view image failed/);
 const retry=prepareFirstView(root,new AbortController().signal,3);await settle();picture.loaded();await retry;assert.match(picture.src,/preloader-retry=3/);
});

test('decode failure triggers a fresh image source on Retry',async t=>{
 const picture=image({complete:true,naturalWidth:100,decode:()=>Promise.reject(new Error('decode failed'))}),root=fixture(t,[picture]);
 await assert.rejects(prepareFirstView(root,new AbortController().signal),/decode failed/);
 picture.decode=()=>Promise.resolve();await prepareFirstView(root,new AbortController().signal,9);assert.match(picture.src,/preloader-retry=9/);
});
