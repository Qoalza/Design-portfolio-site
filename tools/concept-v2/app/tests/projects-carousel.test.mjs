import test from 'node:test';
import assert from 'node:assert/strict';
import {carouselStops,stepTarget,carouselEdges,isHorizontalCarouselWheel} from '../src/projects-carousel.mjs';

test('zero, one and two fitting cards cannot scroll',()=>{
 for(const offsets of [[],[32],[32,648]]){
  assert.deepEqual(carouselStops(offsets,32,0),[0]);
  assert.deepEqual(carouselEdges(0,0),{previous:false,next:false});
 }
});
test('three and five cards step once and stop at the last aligned edge',()=>{
 for(const count of [3,5]){
  const max=(count-2)*616;
  const stops=carouselStops(Array.from({length:count},(_,i)=>32+i*616),32,max);
  let x=0;
  for(let i=0;i<count-2;i++){x=stepTarget(stops,x,1);assert.equal(x,(i+1)*616);}
  assert.equal(stepTarget(stops,x,1),max);
  assert.equal(stepTarget(stops,0,-1),0);
  assert.equal(stepTarget(stops,x,-1),max-616);
 }
});
test('partial gesture and resized trailing edge use measured positions',()=>{
 const stops=carouselStops([32,648,1264],32,700);
 assert.deepEqual(stops,[0,616,700]);
 assert.equal(stepTarget(stops,310,1),616);
 assert.equal(stepTarget(stops,310,-1),0);
 assert.equal(stepTarget(stops,700,1),700);
 assert.deepEqual(carouselEdges(699.5,700),{previous:true,next:false});
});
test('only predominantly horizontal wheel inside the carousel is isolated',()=>{
 const target={closest:selector=>selector==='[data-project-carousel]'?{}:null};
 assert.equal(isHorizontalCarouselWheel({target,deltaX:50,deltaY:3}),true);
 assert.equal(isHorizontalCarouselWheel({target,deltaX:3,deltaY:50}),false);
 assert.equal(isHorizontalCarouselWheel({target,deltaX:0,deltaY:100}),false);
 assert.equal(isHorizontalCarouselWheel({target:null,deltaX:50,deltaY:0}),false);
});
