import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getHeroVariant} from '../src/hero-layout.mjs';
const read=file=>readFile(new URL(`../src/${file}`,import.meta.url),'utf8');

test('portfolio retains a desktop canvas instead of switching to an unapproved narrow layout',async()=>{
 const [main,css,app,experience,lens]=await Promise.all(['main.jsx','style.css','App.jsx','Experience.jsx','lens.css'].map(read));
 assert.doesNotMatch(main,/responsive\.css/);
 assert.match(css,/body\{min-width:1280px\}/);
 assert.doesNotMatch(css,/@media\(max-width:(?:1279|1050|760|380)px\)/);
 assert.doesNotMatch(app,/MobileNavigation|ai-mobile-panel|hero-fact-chip-mobile/);
 assert.doesNotMatch(experience,/window\.innerWidth>=1280/);
 assert.doesNotMatch(lens,/@media\(max-width:/);
});

test('both approved desktop Hero variants retain the joint width and height threshold',()=>{
 for(const [width,height,expected] of [[1920,1080,'small'],[2312,1300,'small'],[2313,1299,'small'],[2313,1300,'large'],[2751,1500,'large'],[2968,955,'small']]){
  assert.equal(getHeroVariant({width,height}),expected,`${width}x${height}`);
 }
});

test('desktop fade continues to use the same background token',async()=>{
 const css=await read('style.css');
 const fade=css.match(/\.hero\[data-layout="large"\] \.hero-bottom-dots::after\{[^}]+\}/)?.[0];
 assert.ok(fade);
 assert.match(fade,/var\(--cv2-container-neutral-bg-main\)/);
 assert.doesNotMatch(fade,/rgb\(20 24 27/);
});
