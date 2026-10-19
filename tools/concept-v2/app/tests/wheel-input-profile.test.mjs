import assert from 'node:assert/strict';
import test from 'node:test';
import {createWheelHandlingProfile,createWheelInputProfile,isProtectedWheelRegion,resolveWheelHandling,resolveWheelEligibility,shouldResetSmoothScroll} from '../src/wheel-input-profile.mjs';

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


test('confirmed mouse input reclaims Lenis within a gesture after native trackpad input',()=>{
  const profile=createWheelInputProfile();
  const handling=createWheelHandlingProfile();
  const observe=event=>{
    const input=profile.observe(event);
    return {input,handling:handling.observe({event,input,protectedRegionVisible:false})};
  };
  assert.deepEqual(observe({deltaMode:0,deltaY:6,timeStamp:0}),{input:'trackpad',handling:'native'});
  assert.deepEqual(observe({deltaMode:0,deltaY:100,wheelDeltaY:-120,timeStamp:260}),{input:'trackpad',handling:'native'},'one ambiguous impulse preserves native trackpad');
  assert.deepEqual(observe({deltaMode:0,deltaY:100,wheelDeltaY:-120,timeStamp:276}),{input:'mouse',handling:'smooth'});
  assert.deepEqual(observe({deltaMode:0,deltaY:100,wheelDeltaY:-120,timeStamp:292}),{input:'mouse',handling:'smooth'});
  assert.deepEqual(observe({deltaMode:0,deltaY:2.75,timeStamp:500}),{input:'trackpad',handling:'native'},'returning to trackpad restores its existing native policy');
});

test('line-mode mouse events reclaim Lenis without waiting for trackpad gesture idle',()=>{
  const profile=createWheelInputProfile();
  const handling=createWheelHandlingProfile();
  const trackpad={deltaMode:0,deltaY:6,timeStamp:0};
  assert.equal(handling.observe({event:trackpad,input:profile.observe(trackpad)}),'native');
  const mouse={deltaMode:1,deltaY:3,timeStamp:30};
  assert.equal(handling.observe({event:mouse,input:profile.observe(mouse)}),'smooth');
});


test('quantized pixel wheel sequences recover mouse smoothing and preserve recorded trackpad input',async()=>{
  const {readFile}=await import('node:fs/promises');
  const sequences=JSON.parse(await readFile(new URL('./fixtures/wheel-sequences.json',import.meta.url),'utf8'));
  const input=createWheelInputProfile(),handling=createWheelHandlingProfile();
  const modes=sequences.mouse.map(event=>{const type=input.observe(event);return resolveWheelEligibility({handling:handling.observe({event,input:type}),input:type,desktop:false});});
  assert.ok(modes.slice(4).includes('smooth'),'the recorded mouse wheel must acquire Lenis below1280px');
  assert.ok(modes.slice(20).every(mode=>mode==='smooth'),'subsequent wheel notches must retain Lenis');
  for(const event of sequences.trackpad){const type=input.observe({...event,timeStamp:event.timeStamp+6000});assert.equal(type,'trackpad');assert.equal(resolveWheelEligibility({handling:handling.observe({event:{...event,timeStamp:event.timeStamp+6000},input:type}),input:type,desktop:false}),'native');}
});

test('mouse eligibility is independent of viewport width while trackpad and motion preferences are preserved',()=>{
  assert.equal(resolveWheelEligibility({handling:'smooth',input:'mouse',desktop:false}),'smooth');
  assert.equal(resolveWheelEligibility({handling:'smooth',input:'mouse',desktop:true}),'smooth');
  assert.equal(resolveWheelEligibility({handling:'native',input:'trackpad',desktop:false}),'native');
  assert.equal(resolveWheelEligibility({handling:'smooth',input:'trackpad',desktop:false}),'native');
  assert.equal(resolveWheelEligibility({handling:'smooth',input:'mouse',desktop:false,reduced:true}),'native');
  assert.equal(resolveWheelEligibility({handling:'smooth',input:'trackpad',desktop:false,protectedRegionVisible:true}),'smooth');
  assert.equal(resolveWheelEligibility({handling:'native',input:'trackpad',desktop:false,stopped:true}),'smooth');
});


test('pixel wheel evidence supports different notch sizes without a device-specific constant',()=>{
  for(const quantum of [48,64,85,127]){
    const profile=createWheelInputProfile();
    profile.observe({deltaMode:0,deltaY:6,timeStamp:0});
    for(const [index,multiple] of [1,2,3].entries())profile.observe({deltaMode:0,deltaY:quantum*multiple,timeStamp:250+index*20});
    assert.equal(profile.current,'mouse');
    assert.equal(profile.observe({deltaMode:0,deltaY:2.5,timeStamp:550}),'trackpad');
  }
});

test('recorded precision trackpad acceleration stays native even without horizontal drift',async()=>{
  const {readFile}=await import('node:fs/promises');
  const {trackpad}=JSON.parse(await readFile(new URL('./fixtures/wheel-sequences.json',import.meta.url),'utf8'));
  const profile=createWheelInputProfile();
  for(const event of trackpad)assert.equal(profile.observe({...event,deltaX:0}),'trackpad');
});


test('recorded fixed pixel-wheel notches acquire smoothing in both directions',async()=>{
  const {readFile}=await import('node:fs/promises');
  const samples=JSON.parse(await readFile(new URL('./fixtures/wheel-sequences.json',import.meta.url),'utf8'));
  for(const sequence of [samples.constantMouse,samples.reverseConstantMouse]){
    const profile=createWheelInputProfile();
    const observed=sequence.map(event=>profile.observe(event));
    assert.equal(observed.at(-1),'mouse');
    assert.equal(observed[7],'mouse');
  }
  const profile=createWheelInputProfile();
  for(const event of samples.constantMouse)profile.observe(event);
  for(const event of samples.secondTrackpad)assert.equal(profile.observe({...event,timeStamp:event.timeStamp+6000}),'trackpad');
});
