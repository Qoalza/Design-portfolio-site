import assert from 'node:assert/strict';
import test from 'node:test';

import {createViewActivity} from '../src/runtime/view-activity.mjs';

function frames(){
 let next=0;const queue=new Map();
 return {request(callback){const id=++next;queue.set(id,callback);return id;},cancel(id){queue.delete(id);},flush(){const pending=[...queue.entries()];queue.clear();pending.forEach(([,callback])=>callback());}};
}

function documentStub(){
 const listeners=new Map();
 return {hidden:false,addEventListener(name,listener){listeners.set(name,listener);},removeEventListener(name){listeners.delete(name);},dispatch(name){listeners.get(name)?.();}};
}

function observerStub(){
 const observers=[];
 return {create(callback,options){const observer={callback,options,target:null,disconnected:false,observe(target){this.target=target;},disconnect(){this.disconnected=true;}};observers.push(observer);return observer;},observers};
}

test('view activity stays inactive until the first intersection result and delays a real exit by one frame',()=>{
 const clock=frames(),doc=documentStub(),io=observerStub(),changes=[];
 const activity=createViewActivity({target:{},documentRef:doc,createObserver:io.create,requestFrame:clock.request,cancelFrame:clock.cancel,onChange:change=>changes.push(change)});
 assert.equal(activity.active,false);
 io.observers[0].callback([{isIntersecting:true}]);
 assert.deepEqual(changes.map(change=>[change.active,change.reason]),[[true,'initial']]);
 io.observers[0].callback([{isIntersecting:false}]);
 assert.equal(activity.active,true);
 clock.flush();
 assert.deepEqual(changes.map(change=>[change.active,change.reason]),[[true,'initial'],[false,'exit']]);
 activity.dispose();
 assert.equal(io.observers[0].disconnected,true);
});

test('view activity cancels a pending exit on re-entry and rechecks intersection after the document becomes visible',()=>{
 const clock=frames(),doc=documentStub(),io=observerStub(),changes=[];
 const activity=createViewActivity({target:{},documentRef:doc,createObserver:io.create,requestFrame:clock.request,cancelFrame:clock.cancel,onChange:change=>changes.push(change)});
 const observer=io.observers[0];
 observer.callback([{isIntersecting:true}]);
 observer.callback([{isIntersecting:false}]);
 observer.callback([{isIntersecting:true}]);
 clock.flush();
 assert.deepEqual(changes.map(change=>change.reason),['initial']);
 doc.hidden=true;doc.dispatch('visibilitychange');
 assert.equal(activity.active,false);
 doc.hidden=false;doc.dispatch('visibilitychange');
 assert.equal(activity.active,false);
 assert.equal(io.observers.length,2);
 io.observers[1].callback([{isIntersecting:true}]);
 assert.deepEqual(changes.map(change=>[change.active,change.reason]),[[true,'initial'],[false,'hidden'],[true,'visible']]);
 activity.dispose();
});
