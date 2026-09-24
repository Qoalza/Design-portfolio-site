import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const appRoot=path.resolve(import.meta.dirname,'..');
const read=relative=>readFile(path.join(appRoot,relative),'utf8');

test('responsive Hero is isolated to the Concept V2 preview route',async()=>{
 const [main,app,definition]=await Promise.all([
  read('src/main.jsx'),
  read('src/App.jsx'),
  read('src/project-hero/definition.mjs')
 ]);
 assert.match(main,/\/preview\/project-responsive-hero/);
 assert.match(main,/<ResponsiveHeroPreview\/>/);
 assert.doesNotMatch(app,/ResponsiveHeroPreview|ProjectResponsiveHero/);
 assert.match(definition,/sceneSrc:'\/responsive-scenes\/corvo-v1\/media-campaigns\/index\.html'/);
 await access(path.join(appRoot,'public/responsive-scenes/corvo-v1/media-campaigns/index.html'));
});

test('responsive Hero preserves direct Corvo scale and inert iframe',async()=>{
 const [component,css]=await Promise.all([
  read('src/project-hero/ProjectResponsiveHero.jsx'),
  read('src/project-hero/ProjectResponsiveHero.module.css')
 ]);
 assert.match(css,/\.logicalProduct\s*\{[\s\S]*?transform:\s*scale\(\.6\)/);
 assert.match(css,/\.productFrame\s*\{[\s\S]*?pointer-events:\s*none/);
 assert.match(component,/tabIndex=\{-1\}/);
 assert.match(component,/aria-hidden="true"/);
});

test('Concept V2 motion keeps the accepted resize and perceptible inertia contract',async()=>{
 const motion=await import('../src/project-hero/motion.mjs');
 const width=await import('../src/project-hero/width.mjs');
 assert.equal(width.RESPONSIVE_HERO_SCALE,.6);
 assert.equal(motion.INERTIA_MAX_OFFSET,96);
 assert.equal(motion.INERTIA_TRANSITION.duration,.32);
 assert.equal(motion.getInertiaOffset(2000,0),96);
 assert.equal(motion.getInertiaOffset(1000,81),0);
 assert.deepEqual(motion.PRESET_TRANSITION,{type:'tween',duration:.5,ease:[.65,0,.35,1]});
});

test('responsive width uses one logical model across presets, breakpoints and drag',async()=>{
 const width=await import('../src/project-hero/width.mjs');
 assert.deepEqual(width.geometryFromDrag({startLogicalWidth:1600,startDisplayWidth:960,physicalDelta:-60}),{
  logicalWidth:1500,
  displayWidth:900
 });
 assert.equal(width.getAdaptiveRange(599),'mobile');
 assert.equal(width.getAdaptiveRange(600),'tablet');
 assert.equal(width.getAdaptiveRange(1279),'tablet');
 assert.equal(width.getAdaptiveRange(1280),'desktop');
 assert.equal(width.getAdaptiveRange(1599),'desktop');
 assert.equal(width.getAdaptiveRange(1600),'max');
 assert.equal(width.clampLogicalWidth(-1),360);
 assert.equal(width.clampDisplayWidth(Number.POSITIVE_INFINITY),1160);
});

test('release motion preserves a fast gesture through a tiny final pointer step',async()=>{
 const motion=await import('../src/project-hero/motion.mjs');
 const velocity=motion.getGestureVelocity([
  {position:0,time:0},
  {position:200,time:50},
  {position:202,time:70}
 ],70);
 assert.ok(velocity>2800);
 assert.equal(motion.getInertiaOffset(velocity,0),96);
 assert.equal(motion.getMagneticPreset(772+16),'tablet');
 assert.equal(motion.getMagneticPreset(772+16.01),null);
});
