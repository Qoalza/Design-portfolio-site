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
 assert.match(definition,/id:'media-campaigns'[\s\S]*?src:'\/responsive-scenes\/corvo-v1\/media-campaigns\/index\.html'/);
 assert.match(definition,/id:'statistics'[\s\S]*?src:'\/responsive-scenes\/corvo-v1\/statistics\/index\.html'/);
 assert.match(definition,/id:'my-space'[\s\S]*?src:'\/responsive-scenes\/corvo-v1\/my-space\/index\.html'/);
 assert.match(definition,/id:'authorization'[\s\S]*?src:'\/responsive-scenes\/corvo-v1\/authorization\/index\.html'/);
 await Promise.all([
  access(path.join(appRoot,'public/responsive-scenes/corvo-v1/media-campaigns/index.html')),
  access(path.join(appRoot,'public/responsive-scenes/corvo-v1/statistics/index.html')),
  access(path.join(appRoot,'public/responsive-scenes/corvo-v1/my-space/index.html')),
  access(path.join(appRoot,'public/responsive-scenes/corvo-v1/authorization/index.html')),
 ]);
 await access(path.join(appRoot,'public/responsive-scenes/corvo-v1/assets/authorization/logo.svg'));
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

test('responsive Hero uses the current Library V2 tab contracts',async()=>{
 const [component,tabComponent,tabCss,heroCss,definition]=await Promise.all([
  read('src/project-hero/ProjectResponsiveHero.jsx'),
  read('src/v2/HeroTabs.jsx'),
  read('src/v2/hero-tabs.css'),
  read('src/project-hero/ProjectResponsiveHero.module.css'),
  read('src/project-hero/definition.mjs')
 ]);

 assert.match(component,/ScenarioTab/);
 assert.match(component,/AdaptiveSizeTab/);
 assert.match(component,/src=\{`\$\{assetRoot\}\/ruler-edge-tick\.svg`\}/);
 assert.doesNotMatch(component,/selected \? "ruler-end-tick" : "ruler-edge-tick"/);
 assert.match(tabComponent,/<svg/);
 assert.doesNotMatch(tabComponent,/maskImage|mask-image/);
 assert.match(tabCss,/\.v2-scenario-tab\s*\{[\s\S]*?height:\s*40px/);
 assert.match(tabCss,/\.v2-size-tab\s*\{[\s\S]*?height:\s*48px/);
 assert.match(tabCss,/--v2-scenario-icon-enable:\s*#747f87/);
 assert.match(tabCss,/--v2-size-subtitle-active:\s*#43a2ee/);
 assert.match(tabCss,/\.v2-scenario-tab-line\s*\{[\s\S]*?height:\s*5px/);
 assert.match(tabCss,/\.v2-scenario-tab-line::after\s*\{[\s\S]*?transform:\s*translateY\(4px\)/);
 assert.match(tabCss,/140ms cubic-bezier\(\.22,\s*1,\s*\.36,\s*1\)/);
 assert.match(tabCss,/user-select:\s*none/);
 assert.match(heroCss,/height:\s*980px/);
 assert.match(heroCss,/\.heroTopbar\s*\{[\s\S]*?height:\s*52px/);
 assert.match(heroCss,/\.adaptiveRuler\s*\{[\s\S]*?height:\s*64px/);
 assert.match(definition,/tabWidth:146/);
 assert.match(definition,/tabWidth:92/);
 assert.match(definition,/tabWidth:97/);
 assert.match(definition,/tabWidth:119/);
});

test('scenario tabs select ready Corvo scenes while adaptive tabs retain preset controls',async()=>{
 const component=await read('src/project-hero/ProjectResponsiveHero.jsx');
 assert.match(component,/const \[activeSceneId, setActiveSceneId\] = useState\(initialScene\.id\)/);
 assert.match(component,/onClick=\{\(\) => selectScene\(scene\.id\)\}/);
 assert.match(component,/src=\{activeScene\?\.src\}/);
 assert.match(component,/onSelect=\{\(\) => selectAdaptive\(layout\.id\)\}/);
 assert.doesNotMatch(component,/interactive=\{false\}/);
});

test('Concept V2 motion keeps the accepted resize and perceptible inertia contract',async()=>{
 const motion=await import('../src/project-hero/motion.mjs');
 const width=await import('../src/project-hero/width.mjs');
 assert.equal(width.RESPONSIVE_HERO_SCALE,.6);
 assert.equal(motion.INERTIA_MAX_OFFSET,160);
 assert.equal(motion.INERTIA_TRANSITION.duration,.42);
 assert.equal(motion.getInertiaOffset(2000,0),160);
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
 assert.equal(motion.getInertiaOffset(velocity,0),160);
 assert.equal(motion.getMagneticPreset(772+16),'tablet');
 assert.equal(motion.getMagneticPreset(772+16.01),null);
});

test('outward motion at hard boundaries is suppressed without a recoil',async()=>{
 const motion=await import('../src/project-hero/motion.mjs');
 const width=await import('../src/project-hero/width.mjs');
 assert.equal(motion.isOutwardBoundaryMotion(width.MIN_DISPLAY_WIDTH,-160),true);
 assert.equal(motion.isOutwardBoundaryMotion(width.MAX_DISPLAY_WIDTH,160),true);
 assert.equal(motion.isOutwardBoundaryMotion(width.MIN_DISPLAY_WIDTH,160),false);
 assert.equal(motion.isOutwardBoundaryMotion(width.MAX_DISPLAY_WIDTH,-160),false);
 assert.equal(motion.isOutwardBoundaryMotion(800,-160),false);
});
