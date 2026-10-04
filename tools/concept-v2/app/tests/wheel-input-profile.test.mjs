import assert from 'node:assert/strict';
import test from 'node:test';
import {createWheelHandlingProfile,createWheelInputProfile,isProtectedWheelRegion,resolveWheelHandling,shouldResetSmoothScroll} from '../src/wheel-input-profile.mjs';

test('discrete mouse wheels retain Lenis smoothing',()=>{
  const profile=createWheelInputProfile();
  assert.equal(profile.observe({deltaMode:1,deltaY:3,timeStamp:0}),'mouse');
  assert.equal(profile.observe({deltaMode:0,deltaY:100,wheelDeltaY:-120,timeStamp:12}),'mouse');
  assert.equal(profile.observe({deltaMode:0,deltaY:96,timeStamp:24}),'mouse');
});

test('continuous precision gestures use native scrolling',()=>{
  const profile=createWheelInputProfile();
  assert.equal(profile.observe({deltaMode:0,deltaY:2.75,timeStamp:0}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaX:1.5,deltaY:18,timeStamp:10}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:64,timeStamp:20}),'trackpad');
});

test('small pixel deltas identify Windows precision touchpads',()=>{
  const profile=createWheelInputProfile();
  assert.equal(profile.observe({deltaMode:0,deltaY:8,timeStamp:0}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:16,timeStamp:8}),'trackpad');
});

test('the profile adapts when the input device changes after a gesture pause',()=>{
  const profile=createWheelInputProfile({gestureIdleMs:160});
  assert.equal(profile.observe({deltaMode:0,deltaY:4,timeStamp:0}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:64,timeStamp:220}),'trackpad','an ambiguous first impulse must not re-enable smoothing');
  assert.equal(profile.observe({deltaMode:1,deltaY:3,timeStamp:440}),'mouse');
  assert.equal(profile.observe({deltaMode:0,deltaY:3.5,timeStamp:660}),'trackpad');
});

test('an ambiguous inertial tail keeps the current gesture profile',()=>{
  const profile=createWheelInputProfile();
  assert.equal(profile.observe({deltaMode:0,deltaY:6,timeStamp:0}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:58,timeStamp:16}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:92,wheelDeltaY:-120,timeStamp:32}),'trackpad');
});

test('one strong first trackpad impulse does not briefly enable mouse smoothing',()=>{
  const profile=createWheelInputProfile({gestureIdleMs:160});
  assert.equal(profile.observe({deltaMode:0,deltaY:6,timeStamp:0}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:-100,wheelDeltaY:120,timeStamp:260}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:-31.5,wheelDeltaY:38,timeStamp:276}),'trackpad');
});

test('an actual mouse can still take ownership after a trackpad gesture',()=>{
  const profile=createWheelInputProfile({gestureIdleMs:160});
  assert.equal(profile.observe({deltaMode:0,deltaY:6,timeStamp:0}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:100,wheelDeltaY:-120,timeStamp:260}),'trackpad');
  assert.equal(profile.observe({deltaMode:0,deltaY:100,wheelDeltaY:-120,timeStamp:276}),'mouse');
});

test('trackpad bypasses Lenis only outside the protected Experience region',()=>{
  assert.equal(resolveWheelHandling({input:'trackpad',protectedRegionVisible:false}),'native');
  assert.equal(resolveWheelHandling({input:'trackpad',protectedRegionVisible:true}),'smooth');
  assert.equal(resolveWheelHandling({input:'mouse',protectedRegionVisible:false}),'smooth');
});

test('a rapid trackpad swipe keeps one handling mode while crossing Experience',()=>{
  const handling=createWheelHandlingProfile({gestureIdleMs:160});
  assert.equal(handling.observe({event:{deltaY:-8,timeStamp:0},input:'trackpad',protectedRegionVisible:false}),'native');
  assert.equal(handling.observe({event:{deltaY:-8,timeStamp:16},input:'trackpad',protectedRegionVisible:true}),'native');
  assert.equal(handling.observe({event:{deltaY:-8,timeStamp:32},input:'trackpad',protectedRegionVisible:true}),'native');
  assert.equal(handling.observe({event:{deltaY:-8,timeStamp:240},input:'trackpad',protectedRegionVisible:true}),'smooth');
  assert.equal(handling.observe({event:{deltaY:-8,timeStamp:256},input:'trackpad',protectedRegionVisible:false}),'smooth');
});

test('a downward trackpad gesture hands back to Lenis when it reaches Experience',()=>{
  const handling=createWheelHandlingProfile({gestureIdleMs:160});
  assert.equal(handling.observe({event:{deltaY:8,timeStamp:0},input:'trackpad',protectedRegionVisible:false}),'native');
  assert.equal(handling.observe({event:{deltaY:8,timeStamp:16},input:'trackpad',protectedRegionVisible:true}),'smooth');
  assert.equal(handling.observe({event:{deltaY:8,timeStamp:32},input:'trackpad',protectedRegionVisible:true}),'smooth');
});

test('changing scroll ownership never cancels native trackpad momentum',()=>{
  assert.equal(shouldResetSmoothScroll({previousHandling:'native',nextHandling:'smooth',isScrolling:'native'}),false);
  assert.equal(shouldResetSmoothScroll({previousHandling:'native',nextHandling:'smooth',isScrolling:false}),false);
  assert.equal(shouldResetSmoothScroll({previousHandling:'smooth',nextHandling:'native',isScrolling:'smooth'}),true);
  assert.equal(shouldResetSmoothScroll({previousHandling:'smooth',nextHandling:'native',isScrolling:false}),false);
});

test('Experience handling begins at its real scroll boundary instead of one viewport early',()=>{
  const bounds={sectionTop:4500,sectionHeight:9800,viewportHeight:1000};
  assert.equal(isProtectedWheelRegion({...bounds,scrollY:3400,deltaY:80}),false,'merely seeing Experience at the viewport edge must stay native');
  assert.equal(isProtectedWheelRegion({...bounds,scrollY:4400,deltaY:80}),false,'a gesture that has not reached the boundary must stay native');
  assert.equal(isProtectedWheelRegion({...bounds,scrollY:4400,deltaY:120}),true,'the crossing event must hand off to the entry stopper');
  assert.equal(isProtectedWheelRegion({...bounds,scrollY:5200,deltaY:80}),true,'gestures that start inside Experience keep its original path');
  assert.equal(isProtectedWheelRegion({...bounds,scrollY:13400,deltaY:-120}),false,'an upward gesture from below Experience remains native');
});
