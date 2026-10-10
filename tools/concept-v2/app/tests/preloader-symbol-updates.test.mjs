import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire,Module} from 'node:module';
import path from 'node:path';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

// Use the installed React DOM host update function, not a guessed reconciliation rule.
// This is a Node test with SVG element doubles; it does not run a browser.
const require=createRequire(import.meta.url);
const client=path.join(path.dirname(require.resolve('react-dom/package.json')),'cjs/react-dom-client.development.js');
const original=readFileSync(client,'utf8');
assert.ok(original.includes('exports.createRoot = function'));
const domModule=new Module(client);domModule.filename=client;domModule.paths=Module._nodeModulePaths(path.dirname(client));
domModule._compile(original.replace('exports.createRoot = function','exports.testUpdateProperties = updateProperties;\n    exports.createRoot = function'),client);
const update=domModule.exports.testUpdateProperties;
const bundled=await build({entryPoints:[new URL('../src/Preloader.jsx',import.meta.url).pathname],bundle:true,write:false,format:'iife',globalName:'Subject',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'symbol-lifecycle',setup(b){
 b.onResolve({filter:/^(react(?:\/jsx-runtime)?|\.\/Controls|\.\/PreloaderMorph)$/},a=>({path:a.path,namespace:'symbol-test'}));
 b.onLoad({filter:/.*/,namespace:'symbol-test'},({path:name})=>({loader:'js',contents:name==='react'?'export const {useState,useEffect,useLayoutEffect,useRef}=globalThis.hooks;':name==='react/jsx-runtime'?'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;':name==='./Controls'?'export function ControlButton(){};':'export function PreloaderMorph(){};export const MORPH_DURATION=370;'}));
}}]});
function harness(){
 let time=0,index=0,next=0;const slots=[],effects=[],layoutEffects=[],frames=new Map();
 const effect=(queue,fn,deps)=>{const at=index++,prior=slots[at];if(!prior||deps.some((v,i)=>v!==prior.deps[i])){prior?.cleanup?.();slots[at]={deps};queue.push(()=>{slots[at].cleanup=fn();});}};
 const hooks={useState:v=>[typeof v==='function'?v():v,()=>{}],useRef(value){const at=index++;return slots[at]??={current:value};},useEffect(fn,deps){effect(effects,fn,deps);},useLayoutEffect(fn,deps){effect(layoutEffects,fn,deps);}};
 const listeners=()=>({addEventListener(){},removeEventListener(){}});
 const context={hooks,location:{search:''},URLSearchParams,window:{matchMedia:()=>({...listeners(),matches:false})},matchMedia:()=>({...listeners(),matches:false}),document:{...listeners(),hidden:false},performance:{now:()=>time},requestAnimationFrame:fn=>{const id=++next;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)};
 runInNewContext(bundled.outputFiles[0].text,context);
 // Get the actual unexported AnimatedSymbol through the production component tree.
 const find=node=>{if(!node||typeof node!=='object')return;if(node.type?.name==='AnimatedSymbol')return node.type;const children=node.props?.children;for(const child of Array.isArray(children)?children:[children]){const result=find(child);if(result)return result;}};
 const SymbolComponent=find(context.Subject.Preloader({state:'normal'}));
 slots.length=0;effects.length=0;layoutEffects.length=0;index=0;
 let nodes=new Map(),writes=0,previous={};
 const svg={querySelector:id=>nodes.get(id),set innerHTML(value){writes++;nodes=new Map([...value.matchAll(/id="([^"]+)"/g)].map(([,id])=>['#'+id,{attributes:{},setAttribute(key,v){this.attributes[key]=v;}}]));}};
 return {render(speed=1,initialPhase,flushPassive=true){index=0;const vnode=SymbolComponent({speedMultiplier:speed,running:true,initialPhase});const props={dangerouslySetInnerHTML:vnode.props.dangerouslySetInnerHTML};update(svg,'svg',previous,props);previous=props;vnode.props.ref.current=svg;while(layoutEffects.length)layoutEffects.shift()();if(flushPassive)while(effects.length)effects.shift()();},step(ms){time+=ms;const pending=[...frames];frames.clear();for(const [,fn]of pending)fn(time);},get marker(){return svg.querySelector('#preloader-marker');},get writes(){return writes;},dispose(){for(const slot of slots)slot?.cleanup?.();}};
}

test('caption/readiness rerenders retain the visible animated SVG nodes and keep advancing',()=>{
 const h=harness();h.render();h.step(250);const marker=h.marker,position=marker.attributes.transform;
 h.render();h.step(250);
 assert.equal(h.marker,marker,'React replaced the visible marker while motion still held the detached one');
 assert.notEqual(h.marker.attributes.transform,position,'visible logo must keep moving after a parent update');
 assert.equal(h.writes,1);h.dispose();
});

test('slow-state speed changes preserve live SVG nodes and continue the same animation',()=>{
 const h=harness();h.render();h.step(250);const marker=h.marker,position=marker.attributes.transform;
 h.render(.5);h.step(200);
 assert.equal(h.marker,marker);assert.notEqual(h.marker.attributes.transform,position);assert.equal(h.writes,1);h.dispose();
});


test('handoff phase is drawn before first paint without waiting for passive effects',()=>{
 const h=harness();h.render(1,{elapsed:600,sampledAt:0},false);
 const position=h.marker.attributes.transform;
 assert.ok(position,'first committed SVG must already show the handed-off phase');
 assert.notEqual(position,'translate(0 0)');
 h.step(200);assert.notEqual(h.marker.attributes.transform,position);h.dispose();
});
