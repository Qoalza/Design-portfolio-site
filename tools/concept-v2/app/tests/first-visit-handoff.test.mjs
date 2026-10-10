import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

// Execute the real component lifecycle, with a retained first-HTML session.
const bundled=await build({entryPoints:[new URL('../src/FirstVisit.jsx',import.meta.url).pathname],bundle:true,write:false,format:'iife',globalName:'Subject',jsx:'automatic',plugins:[{name:'isolated-first-visit',setup(builder){
 builder.onResolve({filter:/^(react(?:\/jsx-runtime)?|\.\/Preloader|\.\/preloader-gate\.mjs|\.\/first-view-readiness\.mjs)$/},args=>({path:args.path,namespace:'first-visit-test'}));
 builder.onLoad({filter:/.*/,namespace:'first-visit-test'},({path})=>({loader:'js',contents:path==='react'?'export const {useState,useRef,useEffect}=globalThis.hooks;':path==='react/jsx-runtime'?'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;':path==='./Preloader'?'export function Preloader(){};export const INITIAL_MESSAGES=[];export const RETRY_MESSAGES={slow:[[],[]],connection:[[],[]]};':path==='./preloader-gate.mjs'?'export const createPreloaderGate=()=>({start(){globalThis.starts++},dispose(){},retry(){}});':'export const prepareFirstView=(root,signal,retry)=>{globalThis.preparations.push({root,signal,retry});return Promise.resolve();};'}));
}}]});
const code=bundled.outputFiles[0].text;
function mount({native=true,mode='normal',reason=null,retryNumber=0}={}){
 let state={visible:true,mode,reason,retryNumber},tree,index=0,dirty=false;
 const slots=[],effects=[],listeners=new Set(),providers=new Set();
 const early={snapshot:()=>state,connect(prepare,listener){providers.add(prepare);listeners.add(listener);listener(state);return()=>{providers.delete(prepare);listeners.delete(listener);};}};
 const context={starts:0,preparations:[],window:{__CONCEPT_EARLY_PRELOADER__:native?early:undefined},location:{},hooks:{
  useState(initial){const at=index++;if(!slots[at])slots[at]={value:typeof initial==='function'?initial():initial};return [slots[at].value,value=>{slots[at].value=typeof value==='function'?value(slots[at].value):value;dirty=true;}];},
  useRef(value){const at=index++;return slots[at]??={current:value};},
  useEffect(fn,deps){const at=index++,previous=slots[at];if(!previous||deps.some((value,i)=>value!==previous.deps[i])){previous?.cleanup?.();slots[at]={deps,setup:fn};effects.push(()=>{slots[at].cleanup=fn();});}},
 }};
 runInNewContext(code,context);
 const render=()=>{index=0;dirty=false;tree=context.Subject.FirstVisit({children:'page'});tree.props.children[0].props.ref.current='actual-page';while(effects.length)effects.shift()();};
 render();
 return {context,providers,listeners,get overlay(){return tree.props.children[1];},get inert(){return tree.props.children[0].props.inert;},emit(next){state=next;for(const listener of listeners)listener(next);if(dirty)render();},replayEffects(){for(const slot of slots)if(slot?.setup){slot.cleanup?.();slot.cleanup=slot.setup();}},unmount(){for(const slot of slots)slot?.cleanup?.();}};
}

test('React registers real first-view readiness without another overlay or gate',async()=>{
 const h=mount({mode:'slow',reason:'slow',retryNumber:2});assert.equal(h.context.starts,0);assert.equal(Boolean(h.overlay),false);assert.equal(h.inert,true);
 const signal=new AbortController().signal;await [...h.providers][0](signal,2);assert.equal(h.context.preparations[0].root,'actual-page');assert.equal(h.context.preparations[0].signal,signal);assert.equal(h.context.preparations[0].retry,2);h.unmount();
});
test('native session keeps page inert through retries, releasing it only after readiness',()=>{
 const h=mount();h.emit({visible:true,mode:'connection',reason:null,retryNumber:0});assert.equal(h.inert,true);assert.equal(Boolean(h.overlay),false);
 h.emit({visible:true,mode:'normal',reason:'connection',retryNumber:1});assert.equal(h.inert,true);
 h.emit({visible:false,mode:'normal',reason:null,retryNumber:0});assert.equal(h.inert,false);h.unmount();
});
test('StrictMode replay replaces subscriptions without restarting the native attempt',()=>{
 const h=mount();h.replayEffects();assert.equal(h.context.starts,0);assert.equal(h.providers.size,1);assert.equal(h.listeners.size,1);h.unmount();assert.equal(h.providers.size,0);assert.equal(h.listeners.size,0);
});
test('isolated app without HTML bootstrap retains its original React gate',()=>{
 const h=mount({native:false});assert.equal(h.context.starts,1);assert.ok(h.overlay);h.unmount();
});
