import assert from 'node:assert/strict';
import test from 'node:test';

import {clientPointToSvg,getHeroVariant} from '../src/hero-layout.mjs';
import {schedulePulses} from '../src/pulse.mjs';

test('Hero switches to the Large source at the 1300px height boundary',()=>{
  assert.equal(getHeroVariant(1299),'small');
  assert.equal(getHeroVariant(1300),'large');
  assert.equal(getHeroVariant(1600),'large');
});

test('pointer coordinates account for SVG meet fields before magnification',()=>{
  assert.deepEqual(clientPointToSvg({clientX:100,clientY:50,rect:{left:0,top:0,width:200,height:100},viewWidth:1000,viewHeight:1000}),{x:500,y:500});
  assert.deepEqual(clientPointToSvg({clientX:0,clientY:50,rect:{left:0,top:0,width:200,height:100},viewWidth:1000,viewHeight:1000}),{x:0,y:500});
  assert.deepEqual(clientPointToSvg({clientX:200,clientY:50,rect:{left:0,top:0,width:200,height:100},viewWidth:1000,viewHeight:1000}),{x:1000,y:500});
});

test('route pulses wait 2–3 seconds and arrive only at their direction terminal',()=>{
  const scheduled=[];
  const cancelled=[];
  const pulses=[];
  const arrivals=[];
  const schedule=(callback,delay)=>{const item={callback,delay,id:scheduled.length+1};scheduled.push(item);return item.id;};
  const stop=schedulePulses({
    routes:[{from:'a',to:'b',duration:800}],
    emit:pulse=>pulses.push(pulse),
    arrive:event=>arrivals.push(event),
    random:()=>0,
    schedule,
    cancel:id=>cancelled.push(id),
  });

  assert.equal(scheduled[0].delay,2000);
  scheduled[0].callback();
  assert.equal(pulses[0].reverse,true);
  assert.equal(scheduled[1].delay,800);
  scheduled[1].callback();
  assert.equal(arrivals[0].node,'a');
  assert.equal(scheduled[2].delay,2000);
  stop();
  assert.ok(cancelled.length>=1);
});
