import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreloaderGate,LOGO_REVOLUTION_MS} from '../src/preloader-gate.mjs';

function clock(){
  let time=0,next=1;
  const timers=new Map();
  const flush=async()=>{for(let i=0;i<5;i+=1)await Promise.resolve();};
  return {
    now:()=>time,
    setTimer:(fn,delay)=>{const id=next++;timers.set(id,{at:time+delay,fn});return id;},
    clearTimer:id=>timers.delete(id),
    async advance(ms){
      const end=time+ms;
      await flush();
      while(true){
        const nextTimer=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];
        if(!nextTimer||nextTimer[1].at>end)break;
        time=nextTimer[1].at;
        timers.delete(nextTimer[0]);
        nextTimer[1].fn();
        await flush();
      }
      time=end;
      await flush();
    },
  };
}

function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}

test('a ready page before 200 ms uses only the soft transition',async()=>{
  const timer=clock(),states=[],calls=[];
  const gate=createPreloaderGate({...timer,onState:state=>states.push(state)});
  gate.start({prepare:()=>Promise.resolve('next'),softTransition:value=>calls.push(value)});
  await timer.advance(199);
  assert.deepEqual(calls,['next']);
  assert.equal(states.length,1);
  assert.equal(states[0].visible,false);
  gate.dispose();
});

test('a pending page at 200 ms gets one full logo revolution before reveal',async()=>{
  const timer=clock(),states=[],calls=[],work=deferred();
  const gate=createPreloaderGate({...timer,onState:state=>states.push(state)});
  gate.start({prepare:()=>work.promise,commit:value=>calls.push(value)});
  await timer.advance(200);
  assert.equal(states.at(-1).visible,true);
  work.resolve('next');
  await timer.advance(LOGO_REVOLUTION_MS-1);
  assert.deepEqual(calls,[]);
  await timer.advance(1);
  assert.deepEqual(calls,['next']);
  assert.equal(states.at(-1).leaving,true);
  await timer.advance(180);
  assert.equal(states.at(-1).visible,false);
  gate.dispose();
});

test('slow loading keeps the attempt alive and Retry aborts it',async()=>{
  const timer=clock(),states=[],signals=[],work=deferred();
  const gate=createPreloaderGate({...timer,onState:state=>states.push(state)});
  gate.start({prepare:signal=>{signals.push(signal);return work.promise;}},{immediate:true});
  await timer.advance(10000);
  assert.equal(states.at(-1).mode,'slow');
  gate.retry();
  assert.equal(signals[0].aborted,true);
  assert.deepEqual([states.at(-1).mode,states.at(-1).reason,states.at(-1).retryNumber],['normal','slow',1]);
  work.resolve('stale');
  await timer.advance(1);
  assert.equal(states.at(-1).visible,true);
  gate.dispose();
});

test('a failed request shows the connection state and a contextual retry',async()=>{
  const timer=clock(),states=[];
  const gate=createPreloaderGate({...timer,onState:state=>states.push(state)});
  gate.start({prepare:()=>Promise.reject(new TypeError('network'))});
  await timer.advance(0);
  assert.equal(states.at(-1).mode,'connection');
  gate.retry();
  assert.deepEqual([states.at(-1).mode,states.at(-1).reason,states.at(-1).retryNumber],['normal','connection',1]);
  gate.dispose();
});

test('ready copy appears only after a confirmed late result',async()=>{
  const timer=clock(),states=[],calls=[],work=deferred();
  const gate=createPreloaderGate({...timer,onState:state=>states.push(state)});
  gate.start({prepare:()=>work.promise,commit:value=>calls.push(value)},{immediate:true});
  await timer.advance(LOGO_REVOLUTION_MS+1);
  assert.equal(states.at(-1).showReadyMessage,false);
  work.resolve('ready');
  await timer.advance(0);
  assert.equal(states.at(-1).showReadyMessage,true);
  await timer.advance(449);
  assert.deepEqual(calls,[]);
  await timer.advance(1);
  assert.deepEqual(calls,['ready']);
  gate.dispose();
});

test('a page ready after the ten-second warning opens directly from the slow state',async()=>{
  const timer=clock(),states=[],calls=[],work=deferred();
  const gate=createPreloaderGate({...timer,onState:state=>states.push(state)});
  gate.start({prepare:()=>work.promise,commit:value=>calls.push(value)},{immediate:true});
  await timer.advance(10000);
  assert.equal(states.at(-1).mode,'slow');
  work.resolve('finally ready');
  await timer.advance(0);
  assert.deepEqual(calls,['finally ready']);
  assert.equal(states.at(-1).mode,'slow');
  assert.equal(states.at(-1).showReadyMessage,false);
  assert.equal(states.at(-1).leaving,true);
  await timer.advance(180);
  assert.equal(states.at(-1).visible,false);
  gate.dispose();
});

test('a new navigation starts with fresh contextual retry copy',async()=>{
  const timer=clock(),states=[];
  const gate=createPreloaderGate({...timer,onState:state=>states.push(state)});
  const connection={prepare:()=>Promise.reject(new TypeError('network'))};
  gate.start(connection);
  await timer.advance(0);
  gate.retry();
  await timer.advance(0);
  assert.equal(states.at(-1).retryNumber,1);
  gate.start(connection);
  await timer.advance(0);
  gate.retry();
  assert.deepEqual([states.at(-1).reason,states.at(-1).retryNumber],['connection',1]);
  gate.dispose();
});
