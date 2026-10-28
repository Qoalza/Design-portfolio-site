import test from 'node:test';
import assert from 'node:assert/strict';
import {createEarlyResources} from '../src/early-preloader-resources.mjs';
function environment(t){
 const previous={document:globalThis.document,window:globalThis.window,location:globalThis.location},listeners=new Map();
 const link={href:'http://localhost/app.css',addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
 Object.assign(globalThis,{document:{querySelector:()=>({content:'http://localhost/app.js'}),querySelectorAll:()=>[link]},window:{addEventListener(){},removeEventListener(){}},location:{href:'http://localhost/'}});
 t.after(()=>{for(const [key,value] of Object.entries(previous))if(value===undefined)delete globalThis[key];else globalThis[key]=value;});return {listeners};
}
test('confirmed CSS error is reported even when application import is still pending',{timeout:1000},async t=>{
 const {listeners}=environment(t),resources=createEarlyResources({loadModule:()=>new Promise(()=>{})});
 const controller=new AbortController(),ready=resources.prepare(controller.signal,0,0);listeners.get('error')();
 await assert.rejects(ready,/stylesheet failed/);controller.abort();resources.dispose();
});
test('confirmed render error is reported even when mandatory CSS is still pending',{timeout:1000},async t=>{
 environment(t);let fail;
 const resources=createEarlyResources({loadModule:async()=>({mountApplication({onError}){fail=onError;return()=>{};}})});
 const controller=new AbortController(),ready=resources.prepare(controller.signal,0,0);
 for(let i=0;i<8;i++)await Promise.resolve();fail(new Error('render failed'));
 await assert.rejects(ready,/render failed/);controller.abort();resources.dispose();
});
