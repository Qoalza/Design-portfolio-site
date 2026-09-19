import assert from 'node:assert/strict';
import test from 'node:test';
import {createImagePreparer} from '../src/media/image-preparation.mjs';

function image({resource='first',complete=true,naturalWidth=20,decode=async()=>{}}={}){
 const target=new EventTarget();
 Object.assign(target,{src:resource,currentSrc:resource,complete,naturalWidth,decode,loading:'lazy',fetchPriority:'auto'});
 return target;
}

test('image preparation only raises priority and reuses the current node/resource promise',async()=>{
 const node=image();
 const preparer=createImagePreparer();
 const low=preparer.prepare(node,'low');
 const high=preparer.prepare(node,'high');
 assert.equal(low,high);
 await high;
 assert.equal(node.fetchPriority,'high');
 await preparer.prepare(node,'low');
 assert.equal(node.fetchPriority,'high');
 assert.equal(node.loading,'eager');
});

test('image preparation creates a new result for a changed resource and never treats failed decoding as ready',async()=>{
 const node=image();
 const preparer=createImagePreparer();
 const first=preparer.prepare(node,'low');
 node.currentSrc='second';
 const second=preparer.prepare(node,'low');
 assert.notEqual(first,second);
 assert.equal(await second,true);
 const broken=image({naturalWidth:0});
 assert.equal(await preparer.prepare(broken,'high'),false);
});

test('disposed preparation ignores a late decode completion',async()=>{
 let resolveDecode;
 const node=image({decode:()=>new Promise(resolve=>{resolveDecode=resolve;})});
 const preparer=createImagePreparer();
 const pending=preparer.prepare(node,'high');
 await Promise.resolve();
 preparer.dispose();
 resolveDecode();
 assert.equal(await pending,false);
});
