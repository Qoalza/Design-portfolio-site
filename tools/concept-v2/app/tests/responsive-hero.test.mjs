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
 const [component,css,authorizationCss]=await Promise.all([
  read('src/project-hero/ProjectResponsiveHero.jsx'),
  read('src/project-hero/ProjectResponsiveHero.module.css'),
  read('public/responsive-scenes/corvo-v1/authorization/style.css')
 ]);
 assert.match(css,/\.logicalProduct\s*\{[\s\S]*?transform:\s*scale\(\.6\)/);
 assert.match(css,/\.productFrame\s*\{[\s\S]*?pointer-events:\s*none/);
 assert.match(component,/useTransform\(displayWidth, getIframeLogicalWidth\)/);
 assert.match(component,/const productHeight = useMotionValue\(initialPreset\.productHeight\)/);
 assert.match(component,/animate\(productHeight, nextProductHeight, transition\)/);
 assert.match(component,/useTransform\(displayWidth, getIframeLogicalHeight\)/);
 assert.match(component,/useTransform\(productHeight, getIframeViewportHeight\)/);
 assert.match(component,/className=\{styles\.iframeCanvas\} style=\{\{ height: animatedLogicalHeight \}\}/);
 assert.match(css,/\.logicalProduct\s*\{[^}]*overflow:\s*clip/);
 assert.doesNotMatch(component,/useTransform\(displayWidth, getProductHeightForDisplayWidth\)/);
 assert.match(component,/activeScene\.id === 'authorization' \? styles\.productViewportDark/);
 // The outer animated surface must remain opaque when the source scene is
 // temporarily shorter than the frame (Desktop -> Tablet). Product CSS is separate.
 assert.doesNotMatch(css,/\.productViewport\s*\{[^}]*border-radius:/);
 assert.match(css,/\.productViewport\s*\{[^}]*clip-path:\s*inset\(0 round 8px 0 0 8px\)/);
 assert.match(css,/\.productViewport\s*\{[^}]*mask-image:\s*linear-gradient\(#000, #000\)/);
 assert.doesNotMatch(css,/\.productViewport\s*\{[^}]*overflow:\s*hidden/);
 assert.match(css,/\.productViewportDark\s*\{[^}]*background:\s*#242625/);
 assert.doesNotMatch(css,/\.productViewportDark\s*\{[^}]*border-radius:/);
 assert.doesNotMatch(component,/mobileIframeRadius|borderTopLeftRadius:|borderBottomLeftRadius:/);
 assert.match(authorizationCss,/\.authorization\s*\{[^}]*background:\s*transparent/);
 assert.match(authorizationCss,/\.auth-panel\s*\{[^}]*border-radius:\s*0/);
 assert.match(authorizationCss,/@media \(min-width:\s*600px\)[\s\S]*?\.authorization\s*\{[^}]*background:\s*#242625/);
 assert.match(authorizationCss,/@media \(min-width:\s*600px\)[\s\S]*?\.auth-panel\s*\{[^}]*border-radius:\s*28px/);
 assert.match(authorizationCss,/@media \(min-width:\s*1280px\)[\s\S]*?\.auth-panel\s*\{[^}]*border-radius:\s*32px/);
 assert.match(component,/tabIndex=\{-1\}/);
 // This inert preview must not flash browser scrollbars during animated resize.
 assert.match(component,/<iframe\s+className=\{styles\.productFrame\}\s+scrolling="no"/);
 assert.match(component,/aria-hidden="true"/);
});

test('responsive Hero uses the current Library V2 tab contracts',async()=>{
 const [component,tabComponent,tabCss,heroCss,definition,topbarSeparation]=await Promise.all([
  read('src/project-hero/ProjectResponsiveHero.jsx'),
  read('src/v2/HeroTabs.jsx'),
  read('src/v2/hero-tabs.css'),
  read('src/project-hero/ProjectResponsiveHero.module.css'),
  read('src/project-hero/definition.mjs'),
  read('public/assets/projects/corvo/responsive-hero/topbar-separation.svg')
 ]);

 assert.match(component,/ScenarioTab/);
 assert.match(component,/AdaptiveSizeTab/);
 assert.match(component,/src=\{`\$\{assetRoot\}\/ruler-edge-tick\.svg`\}/);
 assert.doesNotMatch(component,/selected \? "ruler-end-tick" : "ruler-edge-tick"/);
 assert.match(tabComponent,/<svg/);
 assert.doesNotMatch(tabComponent,/maskImage|mask-image/);
 assert.match(tabComponent,/vectorEffect:\s*'non-scaling-stroke'/);
 assert.match(tabComponent,/name==='scenario-auth'[^\n]*transform="matrix\(/);
 assert.match(tabComponent,/name==='size-mobile'[^\n]*stroke="currentColor"/);
 assert.match(tabComponent,/name==='size-mobile'[^\n]*transform="translate\(4 1\.33333337\)"/);
 assert.match(tabComponent,/name==='size-mobile'[^\n]*fill="currentColor" fillOpacity="\.2"/);
 assert.match(tabCss,/\.v2-scenario-tab\s*\{[\s\S]*?height:\s*40px/);
 assert.match(tabCss,/\.v2-size-tab\s*\{[\s\S]*?height:\s*48px/);
 assert.match(tabCss,/--v2-scenario-icon-enable:\s*#747f87/);
 assert.match(tabCss,/--v2-size-subtitle-active:\s*#43a2ee/);
 assert.match(tabCss,/\.v2-scenario-tab\s*\{[^}]*overflow:\s*hidden/);
 assert.match(tabCss,/\.v2-scenario-tab-line\s*\{[^}]*height:\s*1px;[^}]*overflow:\s*hidden/);
 assert.match(tabCss,/\.v2-scenario-tab-line::after\s*\{[^}]*transform:\s*translateY\(1px\)/);
 assert.match(tabCss,/\.v2-scenario-tab-line::after\s*\{[^}]*transition:\s*transform 250ms/);
 assert.match(tabCss,/\.v2-scenario-tab-line::after\s*\{[^}]*opacity:\s*0/);
 assert.match(tabCss,/\.v2-scenario-tab:hover \.v2-scenario-tab-line::after\s*\{[^}]*opacity:\s*1/);
 assert.doesNotMatch(tabCss,/\.v2-scenario-tab-line::after\s*\{[^}]*visibility:/);
 assert.doesNotMatch(heroCss,/\.heroTopbar\s*\{[^}]*overflow:\s*hidden/);
 assert.match(tabCss,/user-select:\s*none/);
 assert.match(heroCss,/height:\s*980px/);
 assert.match(heroCss,/\.heroTopbar\s*\{[\s\S]*?height:\s*52px/);
 assert.match(heroCss,/\.adaptiveRuler\s*\{[\s\S]*?height:\s*64px/);
 assert.match(heroCss,/\.heroTopbarInner::after,[\s\S]*?\.topbarSide::after\s*\{[^}]*#1d2124/s);
 assert.match(heroCss,/\.adaptiveTrack\s*\{[^}]*border-top:\s*1px solid #272d30/s);
 assert.match(topbarSeparation,/stroke="#1D2124"/);
 assert.match(definition,/tabWidth:146/);
 assert.match(definition,/tabWidth:92/);
 assert.match(definition,/tabWidth:97/);
 assert.match(definition,/tabWidth:119/);
});

test('Corvo Hero owns the Figma workspace grid without a second preview grid',async()=>{
 const [heroCss,previewCss]=await Promise.all([
  read('src/project-hero/ProjectResponsiveHero.module.css'),
  read('src/project-hero/ResponsiveHeroPreview.module.css')
 ]);
 assert.match(heroCss,/\.heroWorkspace\s*\{[\s\S]*?position:\s*relative/);
 assert.match(heroCss,/\.heroWorkspace::before\s*\{[\s\S]*?opacity:\s*\.6/);
 assert.match(heroCss,/\.heroWorkspace::before\s*\{[\s\S]*?background-size:\s*320px 320px,\s*320px 320px,\s*20px 20px,\s*20px 20px/);
 assert.match(heroCss,/\.heroWorkspace::before\s*\{[\s\S]*?background-position:\s*-80px 0,\s*-80px 0,\s*0 0,\s*0 0/);
 assert.match(heroCss,/\.heroWorkspace::before\s*\{[\s\S]*?#191e21[\s\S]*?#16191c/);
 assert.match(heroCss,/\.workspaceContent\s*\{[\s\S]*?z-index:\s*1/);
 assert.doesNotMatch(previewCss,/background-image/);
 assert.doesNotMatch(previewCss,/background-size/);
});

test('scenario tabs select ready Corvo scenes while adaptive tabs retain preset controls',async()=>{
 const [component,tabCss,heroCss]=await Promise.all([
  read('src/project-hero/ProjectResponsiveHero.jsx'),
  read('src/v2/hero-tabs.css'),
  read('src/project-hero/ProjectResponsiveHero.module.css')
 ]);
 assert.match(component,/const \[activeSceneId, setActiveSceneId\] = useState\(initialScene\.id\)/);
 assert.match(component,/onClick=\{\(\) => selectScene\(scene\.id\)\}/);
 assert.match(component,/src=\{activeScene\?\.src\}/);
 assert.match(component,/onSelect=\{\(\) => selectAdaptive\(layout\.id\)\}/);
 assert.doesNotMatch(component,/interactive=\{false\}/);
 assert.match(component,/activeLineLeft = definition\.scenes[\s\S]*?scene\.tabWidth \+ SCENARIO_TAB_GAP/);
 assert.match(component,/--v2-scenario-active-line-opacity': 0/);
 assert.match(component,/<motion\.span[\s\S]*?className=\{styles\.scenarioActiveLine\}[\s\S]*?animate=\{\{left: activeLineLeft, width: activeScene\.tabWidth\}\}/);
 assert.match(component,/transition=\{prefersReducedMotion \? \{duration: 0\} : \{type: 'tween', duration: \.35/);
 assert.match(tabCss,/opacity: var\(--v2-scenario-active-line-opacity, 1\)/);
 assert.match(heroCss,/\.scenarioActiveLine\s*\{[^}]*bottom:\s*0;[^}]*height:\s*1px/);
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
 for(const preset of Object.values(width.ADAPTIVE_PRESETS)) {
  assert.ok(Math.abs(preset.logicalWidth*width.RESPONSIVE_HERO_SCALE-preset.displayWidth)<.000001,preset.id);
  assert.equal(width.getIframeLogicalWidth(preset.displayWidth),Math.ceil(preset.logicalWidth));
 }
 const fractionalDisplayWidth=710.5078125;
 const iframeLogicalWidth=width.getIframeLogicalWidth(fractionalDisplayWidth);
 assert.equal(iframeLogicalWidth,1185);
 assert.ok(iframeLogicalWidth*width.RESPONSIVE_HERO_SCALE-fractionalDisplayWidth>=0);
 assert.ok(iframeLogicalWidth*width.RESPONSIVE_HERO_SCALE-fractionalDisplayWidth<width.RESPONSIVE_HERO_SCALE);
 assert.deepEqual(width.geometryFromDrag({startLogicalWidth:1600,startDisplayWidth:960,physicalDelta:-60}),{
  logicalWidth:1500,
  displayWidth:900
 });
 assert.deepEqual(width.geometryFromDrag({startLogicalWidth:1279,startDisplayWidth:772,physicalDelta:0}),{
  logicalWidth:1286.6666666666667,
  displayWidth:772
 });
 assert.equal(width.getProductHeightForDisplayWidth(599*width.RESPONSIVE_HERO_SCALE),384);
 assert.equal(width.getProductHeightForDisplayWidth(600*width.RESPONSIVE_HERO_SCALE),660);
 assert.equal(width.getIframeLogicalHeight(599*width.RESPONSIVE_HERO_SCALE),640);
 assert.equal(width.getIframeLogicalWidth(599.4*width.RESPONSIVE_HERO_SCALE),600);
 assert.equal(width.getIframeLogicalHeight(599.4*width.RESPONSIVE_HERO_SCALE),1100);
 assert.equal(width.getIframeLogicalHeight(600*width.RESPONSIVE_HERO_SCALE),1100);
 assert.equal(width.getProductHeightForDisplayWidth(1280*width.RESPONSIVE_HERO_SCALE),576);
 assert.equal(width.getProductHeightForDisplayWidth(1279*width.RESPONSIVE_HERO_SCALE+.01),576);
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
 const width=await import('../src/project-hero/width.mjs');
 const velocity=motion.getGestureVelocity([
  {position:0,time:0},
  {position:200,time:50},
  {position:202,time:70}
 ],70);
 assert.ok(velocity>2800);
 assert.equal(motion.getInertiaOffset(velocity,0),160);
 const tabletDisplayWidth=width.ADAPTIVE_PRESETS.tablet.displayWidth;
 assert.equal(motion.getMagneticPreset(tabletDisplayWidth+16),'tablet');
 assert.equal(motion.getMagneticPreset(tabletDisplayWidth+16.01),null);
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
