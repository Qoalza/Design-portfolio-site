import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {ABOUT_CARD_ANIMATION_MS,ABOUT_CARD_FRAME,ABOUT_VIEWER_CARD_FRAME,aboutCardSlots,aboutDeckFrames,aboutNextCard,aboutTransitionFrames,interpolateDeckFrames} from '../src/about-motion.mjs';

const root=path.resolve(import.meta.dirname,'..');

test('embedded deck preserves the current Figma 0.8× rear-card geometry',()=>{
 assert.equal(ABOUT_CARD_ANIMATION_MS,500);
 assert.deepEqual(ABOUT_CARD_FRAME,{width:480,height:420,frontWidth:320,frontHeight:420,backWidth:256,backHeight:336});
 assert.deepEqual(aboutCardSlots(0),{front:0,left:2,right:1});
 const frames=aboutDeckFrames(0);
 assert.deepEqual(frames[0],{x:80,y:0,width:320,height:420,contentScale:1,frontness:1,rearStrength:0,zIndex:3});
 assert.deepEqual(frames[1],{x:200,y:42,width:256,height:336,contentScale:.8,frontness:0,rearStrength:1,zIndex:2});
 assert.deepEqual(frames[2],{x:24,y:42,width:256,height:336,contentScale:.8,frontness:0,rearStrength:1,zIndex:1});
 assert.equal(frames[1].x-(frames[2].x+frames[2].width),-80);
 assert.equal(aboutNextCard(2,1),0);
 assert.equal(aboutNextCard(0,-1),2);
});

test('viewer retains its separate prior rear-card geometry',()=>{
 assert.deepEqual(ABOUT_VIEWER_CARD_FRAME,{width:480,height:420,frontWidth:320,frontHeight:420,backWidth:191,backHeight:296});
 const frames=aboutDeckFrames(0,3,'viewer');
 assert.equal(frames[1].width,191);
 assert.equal(frames[1].height,296);
 assert.equal(frames[1].x,289);
});

test('embedded motion stays inside the 480px stage and separates the handoff at midpoint',()=>{
 for(const direction of [-1,1]){
  for(let step=0;step<=120;step++){
   const frames=aboutTransitionFrames({active:0,direction,progress:step/120});
   for(const frame of frames){
    assert.ok(frame.x>=0,`left bound at ${step}`);
    assert.ok(frame.x+frame.width<=480,`right bound at ${step}`);
    assert.ok(frame.contentScale>0&&frame.contentScale<=1);
   }
  }
 }
 const frames=aboutTransitionFrames({active:0,direction:1,progress:.5});
 const outgoing=frames[0],incoming=frames[1];
 assert.ok(outgoing.x+outgoing.width<=incoming.x-8);
});

test('card content has its own proportional scale track rather than a refit to mask dimensions',()=>{
 const start=aboutTransitionFrames({active:0,direction:1,progress:0});
 const middle=aboutTransitionFrames({active:0,direction:1,progress:.5});
 const end=aboutTransitionFrames({active:0,direction:1,progress:1});
 assert.equal(start[0].contentScale,1);
 assert.equal(middle[0].contentScale,.86875);
 assert.equal(middle[1].contentScale,.7129333333333333);
 assert.equal(end[0].contentScale,.8);
});

test('retargeted deck interpolation preserves every card identity and does not leave the stage',()=>{
 const from=aboutTransitionFrames({active:0,direction:1,progress:.36});
 const to=aboutDeckFrames(2);
 const velocity=from.map(()=>({x:.16,y:0,width:0,height:0,frontness:0}));
 const first=interpolateDeckFrames(from,to,0,velocity);
 assert.deepEqual(first,from);
 const frames=interpolateDeckFrames(from,to,.5,velocity);
 assert.equal(frames.length,3);
 for(const frame of frames){
  assert.ok(frame.x>=0);
  assert.ok(frame.x+frame.width<=480);
  assert.ok(frame.contentScale>0&&frame.contentScale<=1);
 }
});

test('rapid retargets stay inside the embedded stage for every 120fps frame',()=>{
 for(const direction of [-1,1]){
  for(let step=1;step<60;step++){
   const from=aboutTransitionFrames({active:0,direction,progress:step/120});
   const prior=aboutTransitionFrames({active:0,direction,progress:(step-1)/120});
   const velocity=from.map((frame,index)=>({
    x:(frame.x-prior[index].x)/(1000/120),y:(frame.y-prior[index].y)/(1000/120),
    width:(frame.width-prior[index].width)/(1000/120),height:(frame.height-prior[index].height)/(1000/120),
    frontness:(frame.frontness-prior[index].frontness)/(1000/120),contentScale:(frame.contentScale-prior[index].contentScale)/(1000/120),
   }));
   for(let target=0;target<3;target++){
    for(let sample=0;sample<=120;sample++){
     for(const frame of interpolateDeckFrames(from,aboutDeckFrames(target),sample/120,velocity)){
      assert.ok(frame.x>=0,`retarget left bound at ${direction}/${step}/${target}/${sample}`);
      assert.ok(frame.x+frame.width<=480,`retarget right bound at ${direction}/${step}/${target}/${sample}`);
     }
    }
   }
  }
 }
});

test('about structure maps the complete Figma block with native patterns and component controls',async()=>{
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 const about=await readFile(path.join(root,'src/About.jsx'),'utf8');
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 assert.match(app,/import \{About\} from '.\/About'/);
 assert.match(app,/<About\/>/);
 assert.match(about,/data-figma-node="3214:124474"/);
 assert.match(about,/data-figma-node="3215:124481"/);
 assert.match(about,/ControlButton/);
 assert.match(about,/Это я ездил с Урала на Юг\.<br\/>Проехал 2500км за 3 дня\./);
 assert.match(about,/Это мои сладкие дети,<br\/>Тима и Алиса :3/);
 assert.match(css,/\.about-pattern\{[^}]*inset:0[^}]*radial-gradient\(circle,#232526 0 2px,transparent 2\.5px\)[^}]*background-size:16px 16px/);
 assert.match(css,/\.about-dash-horizontal/);
 assert.match(css,/\.about-card-content\{[^}]*width:320px[^}]*height:420px/);
 assert.match(css,/\.about-card-frame\{[^}]*overflow:hidden/);
 assert.match(css,/\.about-card-image\{[^}]*object-fit:cover/);
 assert.match(about,/function useDeckController/);
 assert.match(about,/function ImageViewer/);
 assert.match(about,/new ResizeObserver\(update\)/);
 assert.match(about,/const \[viewerInitial,setViewerInitial\]/);
 assert.doesNotMatch(about,/setActive\(next\)/);
 assert.match(css,/about-viewer-deck \.about-card-caption[^}]*display:none/);
});
