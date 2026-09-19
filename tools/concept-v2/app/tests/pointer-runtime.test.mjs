import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..');

test('pointer consumers route high-frequency work through the shared finite frame task',async()=>{
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 const lens=await readFile(path.join(root,'src/SvgLens.jsx'),'utf8');
 const network=await readFile(path.join(root,'src/SvgNetwork.jsx'),'utf8');
 const about=await readFile(path.join(root,'src/About.jsx'),'utf8');
 assert.match(app,/const task=createFrameTask\(\{write:\(\{x,y,nextMode\}\)=>/);
 assert.match(app,/task\.schedule\(\{x:event\.clientX,y:event\.clientY,nextMode:next\}\)/);
 assert.match(app,/document\.addEventListener\('visibilitychange',visibility\)/);
 assert.match(lens,/const task=createFrameTask\(\{/);
 assert.match(lens,/read:payload=>\{\n\s*const rect=area\.current\?\.getBoundingClientRect\(\)/);
 assert.match(lens,/pointerTaskRef\.current\?\.schedule\(\{kind:'move'/);
 assert.match(lens,/pointerTaskRef\.current\?\.cancel\(\)/);
 assert.match(network,/export const SvgNetwork=memo\(function SvgNetwork/);
 assert.match(about,/const task=createFrameTask\(\{/);
 assert.match(about,/activity=createViewActivity\(\{target:carouselRef\.current/);
 assert.match(about,/document\.addEventListener\('pointermove',updateHover,\{passive:true\}\)/);
});

test('deck reduced-motion settlement invalidates an earlier animation before it can write again',async()=>{
 const about=await readFile(path.join(root,'src/About.jsx'),'utf8');
 const go=about.slice(about.indexOf('const go=useCallback'));
 const before=go.indexOf("if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)");
 const cancel=go.indexOf('cancelAnimationFrame(rafRef.current)');
 assert.ok(cancel!==-1&&cancel<before);
 assert.match(about,/const generation=\+\+generationRef\.current/);
 assert.match(about,/if\(generation!==generationRef\.current\)return/);
 assert.match(about,/velocityRef\.current=finishFrames\.map/);
});
