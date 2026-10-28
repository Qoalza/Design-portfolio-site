import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoffAnimationTimeline} from '../src/project-page/boff-animation-timeline.mjs';
function harness(){
 let time=0,task=null,cancelled=0;const frames={};
 const timeline=createBoffAnimationTimeline({
  scenes:[{id:'side',group:'panels',frames:241,fps:60},{id:'details',group:'panels',frames:241,fps:60},{id:'payout',group:'payout',frames:240,fps:60},{id:'api',group:'api',frames:420,fps:60}],
  render:(id,frame)=>{frames[id]=frame;},now:()=>time,
  requestFrame:callback=>{task=callback;return 1;},cancelFrame:()=>{task=null;cancelled++;},
 });
 return {timeline,frames,advance(ms){time+=ms;const next=task;task=null;next?.(time);},get pending(){return Boolean(task);},get cancelled(){return cancelled;}};
}
test('panels share one timeline even when only one is visible',()=>{
 const h=harness();h.timeline.setVisible('side',true);h.advance(1000);
 assert.equal(h.frames.side,60);
 h.timeline.setVisible('details',true);
 assert.equal(h.frames.details,h.frames.side);
 h.advance(500);assert.equal(h.frames.details,90);assert.equal(h.frames.side,90);
});
test('approved durations loop independently at original speed',()=>{
 const h=harness();for(const id of ['side','details','payout','api'])h.timeline.setVisible(id,true);
 h.advance(4500);assert.equal(h.frames.side,29);assert.equal(h.frames.payout,30);assert.equal(h.frames.api,270);
});
test('offscreen and hidden-tab time do not advance animations',()=>{
 const h=harness();h.timeline.setVisible('api',true);h.advance(1000);
 h.timeline.setVisible('api',false);assert.equal(h.pending,false);h.advance(8000);
 h.timeline.setVisible('api',true);assert.equal(h.frames.api,60);
 h.timeline.setPageVisible(false);assert.equal(h.pending,false);h.advance(5000);
 h.timeline.setPageVisible(true);h.advance(500);assert.equal(h.frames.api,90);
});
test('reduced motion renders frame zero and schedules no frames; cleanup is final',()=>{
 const h=harness();h.timeline.setReducedMotion(true);h.timeline.setVisible('side',true);
 assert.equal(h.frames.side,0);assert.equal(h.pending,false);
 h.timeline.setReducedMotion(false);h.advance(1000);assert.equal(h.frames.side,60);
 h.timeline.destroy();assert.equal(h.pending,false);h.timeline.setVisible('api',true);h.advance(1000);assert.equal(h.pending,false);assert.ok(h.cancelled>0);
});
