import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceHoverFrame,colorizeProcessAnimation,processHoverSpeeds,easedHoverFrame} from '../src/process-motion.mjs';
test('hover stops at authored hold and reverses from current frame',()=>{
 assert.equal(advanceHoverFrame(0,true,200,75,30),18.75);
 assert.equal(advanceHoverFrame(15,false,100,75,30),5.625);
 assert.equal(advanceHoverFrame(7.5,true,100,75,30),16.875);
 assert.equal(advanceHoverFrame(15,true,2000,75,30),30);
 assert.equal(advanceHoverFrame(15,false,2000,75,30),0);
});
test('color layer preserves geometry and interpolated seam colors without mutating source',()=>{
 const source={shapes:[{ty:'sh',ks:{k:[1,2]}},{ty:'st',c:{a:1,k:[{t:0,s:[86/255,92/255,97/255,1]},{t:20,s:[120/255,128/255,135/255,1]}]}}]};
 const copy=structuredClone(source),result=colorizeProcessAnimation(source);
 assert.deepEqual(source,copy);
 assert.deepEqual(result.shapes[0],source.shapes[0]);
 assert.deepEqual(result.shapes[1].c.k[0].s,[29/255,144/255,235/255,1]);
 assert.deepEqual(result.shapes[1].c.k[1].s,[98/255,184/255,252/255,1]);
});

test('separator uses the same frame clock instead of a competing CSS transition',async()=>{
 const {readFile}=await import('node:fs/promises');
 const component=await readFile(new URL('../src/ProcessIcon.jsx',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(component,/setProperty\('--process-progress',String\(media.matches\?\(target.current\?1:0\):frame\/hold\)\)/);
 assert.match(css,/\.step\[data-process-motion\] \.step-divider::after\{transform:scaleX\(var\(--process-progress,0\)\);transition:none\}/);
});

test('all three icons reach hold at 125 percent speed',()=>{
 for(const [fps,hold,ms] of [[80,49,490],[60,30,400],[75,30,320]]){
  assert.equal(advanceHoverFrame(0,true,ms,fps,hold),hold);
  assert.equal(advanceHoverFrame(hold,false,ms,fps,hold),0);
 }
});

test('folder and system run another 15 percent faster while rocket retains its speed',()=>{
 assert.deepEqual(processHoverSpeeds,[1.4375,1.4375,1.25]);
 for(const [index,fps,hold,previous] of [[0,80,49,490],[1,60,30,400],[2,75,30,320]]){
  const elapsed=index<2?previous/1.15:previous;
  assert.ok(Math.abs(advanceHoverFrame(0,true,elapsed,fps,hold,processHoverSpeeds[index])-hold)<1e-10);
  assert.ok(advanceHoverFrame(hold,false,elapsed,fps,hold,processHoverSpeeds[index])<1e-10);
 }
});

test('ease-in-out softens both ends without changing midpoint or duration',()=>{
 const hold=49;
 assert.equal(easedHoverFrame(0,hold),0);
 assert.equal(easedHoverFrame(hold/2,hold),hold/2);
 assert.equal(easedHoverFrame(hold,hold),hold);
 assert.ok(easedHoverFrame(hold/4,hold)<hold/4);
 assert.ok(easedHoverFrame(hold*3/4,hold)>hold*3/4);
 const edgeStep=easedHoverFrame(hold*.01,hold);
 const middleStep=easedHoverFrame(hold*.51,hold)-easedHoverFrame(hold*.5,hold);
 assert.ok(edgeStep<middleStep/10);
 assert.ok(Math.abs((hold-easedHoverFrame(hold*.99,hold))-edgeStep)<1e-10);
 for(let i=0;i<=100;i++)assert.ok(Math.abs(easedHoverFrame(hold*i/100,hold)+easedHoverFrame(hold*(1-i/100),hold)-hold)<1e-10);
});
