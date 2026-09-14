import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {ABOUT_CARD_ANIMATION_MS,ABOUT_CARD_FRAME,ABOUT_VIEWER_SCALE,ABOUT_VIEWER_STAGE,aboutCardSlots,aboutDeckFrames,aboutNextCard,aboutTransitionFrames,interpolateDeckFrames,scaleAboutFrame} from '../src/about-motion.mjs';

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

test('viewer is a direct 1.5× scale of the accepted embedded card component',()=>{
 assert.equal(ABOUT_VIEWER_SCALE,1.5);
 assert.deepEqual(ABOUT_VIEWER_STAGE,{width:720,height:630,scale:1.5});
 const frames=aboutDeckFrames(0);
 const front=scaleAboutFrame(frames[0]);
 const rear=scaleAboutFrame(frames[1]);
 const leftRear=scaleAboutFrame(frames[2]);
 assert.deepEqual({x:front.x,y:front.y,width:front.width,height:front.height,contentScale:front.contentScale},{x:120,y:0,width:480,height:630,contentScale:1.5});
 assert.deepEqual({x:rear.x,y:rear.y,width:rear.width,height:rear.height,contentScale:rear.contentScale},{x:300,y:63,width:384,height:504,contentScale:1.2});
 assert.equal(rear.x-(leftRear.x+leftRear.width),-120);
});

test('embedded motion uses one shared continuous path inside the 480px stage',()=>{
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
 const start=aboutTransitionFrames({active:0,direction:1,progress:0});
 const finish=aboutTransitionFrames({active:0,direction:1,progress:1});
 for(let index=0;index<3;index++){
  assert.notDeepEqual(start[index],finish[index]);
 }
});

test('the exchanging cards clear each other at the continuous hand-off',()=>{
 for(const direction of [-1,1]){
  const frames=aboutTransitionFrames({active:0,direction,progress:.5});
  const outgoing=frames[0];
  const incoming=frames[direction===1?1:2];
  const [left,right]=outgoing.x<incoming.x?[outgoing,incoming]:[incoming,outgoing];
  assert.ok(left.x+left.width<=right.x,`cards overlap at the ${direction===1?'next':'previous'} hand-off`);
 }
});

test('card content has its own proportional scale track rather than a refit to mask dimensions',()=>{
 const start=aboutTransitionFrames({active:0,direction:1,progress:0});
 const middle=aboutTransitionFrames({active:0,direction:1,progress:.5});
 const end=aboutTransitionFrames({active:0,direction:1,progress:1});
 assert.equal(start[0].contentScale,1);
 assert.equal(middle[0].contentScale,.9);
 assert.equal(middle[1].contentScale,.9);
 assert.equal(end[0].contentScale,.8);
});

test('retargeted deck interpolation preserves every card identity and does not leave the stage',()=>{
 const from=aboutTransitionFrames({active:0,direction:1,progress:.36});
 const to=aboutDeckFrames(2);
 const velocity=from.map(()=>({x:.16,y:0,width:0,height:0,frontness:0,contentScale:0}));
 const first=interpolateDeckFrames(from,to,0,velocity);
 assert.deepEqual(first,from);
 const early=interpolateDeckFrames(from,to,.01,velocity);
 assert.ok(early.every((frame,index)=>frame.x>from[index].x),'retarget carries the current velocity into the next frame');
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
      assert.ok(frame.contentScale>0&&frame.contentScale<=1,`retarget content scale at ${direction}/${step}/${target}/${sample}`);
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
 assert.match(css,/\.about-pattern\{background-image:url\('\/figma\/dot-tile\.svg'\);background-size:16px 16px;background-position:0 0\}/);
 assert.doesNotMatch(css,/\.about-pattern\{[^}]*radial-gradient/);
 assert.match(css,/\.about-dash-horizontal/);
 assert.match(css,/\.about-card-content\{[^}]*width:320px[^}]*height:420px/);
 assert.match(css,/\.about-card-frame\{[^}]*overflow:hidden/);
 assert.match(css,/\.about-card-image\{[^}]*object-fit:cover/);
 assert.match(about,/function useDeckController/);
 assert.match(about,/function ImageViewer/);
 assert.match(about,/new ResizeObserver\(update\)/);
 assert.match(about,/const \[viewerInitial,setViewerInitial\]/);
 assert.match(about,/const visibleCard=cards\[controller\.frames\.reduce/);
 assert.doesNotMatch(about,/setActive\(next\)/);
 assert.match(css,/about-viewer-deck \.about-card-caption[^}]*display:none/);
});

test('card treatment keeps the sharp border outside geometry and viewer uses one direct scale',async()=>{
 const about=await readFile(path.join(root,'src/About.jsx'),'utf8');
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 assert.match(about,/about-viewer-deck-stage/);
 assert.match(about,/about-viewer-deck-scale/);
 assert.match(about,/about-card-hover/);
 assert.match(css,/\.about-card-frame\{--card-border-width:calc\(\.8px \+ var\(--card-frontness\) \* \.2px\);border:0/);
 assert.match(css,/box-shadow:inset 0 0 0 var\(--card-border-width\) rgba\(225,231,235,\.2\)/);
 assert.match(css,/rgba\(19,20,20,calc\(\.7 \* var\(--card-frontness\)\)\) 88\.746%,rgba\(19,20,20,var\(--card-frontness\)\) 100%/);
 assert.match(css,/\.about-card-shade\{position:absolute;z-index:1;inset:0;background:linear-gradient/);
 assert.match(css,/\.about-viewer-deck-stage\{position:relative;width:720px;height:630px/);
 assert.match(css,/\.about-viewer-deck-scale\{[^}]*transform:translateX\(-50%\) scale\(1\.5\)/);
 assert.match(css,/\.about-viewer-deck \.about-card-motion\{width:var\(--card-width\);height:var\(--card-height\);transform:translate3d\(var\(--card-x\),var\(--card-y\),0\)/);
 assert.match(css,/\.about-viewer-content p\{[^}]*min-height:96px/);
 assert.match(about,/variant="light" className="about-square about-viewer-prev"/);
 assert.match(about,/variant="light" className="about-square about-viewer-next"/);
 assert.match(about,/const closeFromEmptyViewerSpace=event=>/);
 assert.match(about,/event\.target\.closest\('\.about-viewer-content,\.about-viewer-close,\.about-viewer-prev,\.about-viewer-next'\)/);
 assert.match(about,/<div className="about-viewer" role="presentation" onClick=\{closeFromEmptyViewerSpace\}>/);
 assert.match(css,/\.about-viewer-prev\{left:332px\}/);
 assert.match(css,/\.about-viewer-next\{right:332px\}/);
 assert.match(css,/\.about-viewer-prev,\.about-viewer-next\{position:absolute;z-index:6;top:calc\(50% - 48px\)/);
 assert.match(css,/\.about-viewer-close\{position:absolute;z-index:6;top:48px;right:276px;box-sizing:border-box;width:107px/);
 assert.doesNotMatch(css,/1\.625|1\.43333/);
});
