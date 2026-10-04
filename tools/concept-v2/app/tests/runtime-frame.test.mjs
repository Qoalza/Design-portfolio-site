import assert from 'node:assert/strict';
import test from 'node:test';

import {createFrameTask} from '../src/runtime/frame-task.mjs';

function frames(){
 let next=0;
 const queue=new Map();
 return {
  request(callback){const id=++next;queue.set(id,callback);return id;},
  cancel(id){queue.delete(id);},
  flush(){const pending=[...queue.entries()];queue.clear();pending.forEach(([,callback])=>callback());},
  get size(){return queue.size;},
 };
}

test('frame task coalesces a burst to the newest payload and one read/write pair',()=>{
 const clock=frames(),calls=[];
 const task=createFrameTask({requestFrame:clock.request,cancelFrame:clock.cancel,read:value=>{calls.push(['read',value]);return value*2;},write:value=>calls.push(['write',value])});
 task.schedule(1);task.schedule(2);task.schedule(3);
 assert.equal(clock.size,1);
 clock.flush();
 assert.deepEqual(calls,[['read',3],['write',6]]);
});

test('frame task treats an undefined payload as scheduled work',()=>{
 const clock=frames(),writes=[];
 const task=createFrameTask({requestFrame:clock.request,cancelFrame:clock.cancel,write:value=>writes.push(value)});
 task.schedule();
 clock.flush();
 assert.deepEqual(writes,[undefined]);
});

test('frame task cancellation and disposal invalidate stale callbacks without affecting another task',()=>{
 const clock=frames(),calls=[];
 const first=createFrameTask({requestFrame:clock.request,cancelFrame:clock.cancel,write:value=>calls.push(['first',value])});
 const second=createFrameTask({requestFrame:clock.request,cancelFrame:clock.cancel,write:value=>calls.push(['second',value])});
 first.schedule('cancelled');second.schedule('kept');
 first.cancel();
 clock.flush();
 assert.deepEqual(calls,[['second','kept']]);
 second.schedule('disposed');second.dispose();second.schedule('ignored');
 clock.flush();
 assert.deepEqual(calls,[['second','kept']]);
});

test('frame task preserves a schedule made while it is flushing for the next frame',()=>{
 const clock=frames(),calls=[];
 let task;
 task=createFrameTask({requestFrame:clock.request,cancelFrame:clock.cancel,read:value=>{calls.push(['read',value]);if(value===1)task.schedule(2);return value;},write:value=>calls.push(['write',value])});
 task.schedule(1);clock.flush();
 assert.equal(clock.size,1);
 clock.flush();
 assert.deepEqual(calls,[['read',1],['write',1],['read',2],['write',2]]);
});
