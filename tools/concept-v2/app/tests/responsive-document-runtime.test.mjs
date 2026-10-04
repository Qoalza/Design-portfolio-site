import assert from 'node:assert/strict';
import test from 'node:test';
import {createResponsiveRuntime} from '../src/project-hero/responsive-document-runtime.mjs';
import {layoutHeroDefinition} from '../src/project-hero/layout-document-adapter.mjs';
import {corvoResponsiveHero} from '../src/project-hero/definition.mjs';
import * as width from '../src/project-hero/width.mjs';
import * as motion from '../src/project-hero/motion.mjs';
const ranges=[{id:'mobile',minWidth:360,maxWidth:600,presetWidth:595.256245,height:640},{id:'tablet',minWidth:600,maxWidth:1280,presetWidth:1279,height:1100},{id:'desktop',minWidth:1280,maxWidth:1160/.6,presetWidth:1599,height:960}];
const hero=(enabled=['mobile','tablet','desktop'])=>({kind:'layout',chromeProfile:'layout-four-scenes-v1',initialSceneId:'media-campaigns',adaptives:{enabled},scenes:corvoResponsiveHero.scenes.map(s=>({id:s.id,title:s.label,source:{kind:'url',url:`https://example.com/${s.id}`},adaptives:structuredClone(ranges)}))});
const runtime=h=>createResponsiveRuntime(layoutHeroDefinition({redesign:{hero:h}}));
test('accepted Corvo and legacy preview use exact original width and motion outputs',()=>{
 for(const r of [createResponsiveRuntime(corvoResponsiveHero),runtime(hero())]){const id='media-campaigns';
  for(let value=216;value<=1160;value+=.25){assert.equal(r.displayWidth(id,value),value);assert.equal(r.height(id,value),width.getProductHeightForDisplayWidth(value));assert.equal(r.exact(id,value),width.getExactAdaptivePreset(value));assert.equal(r.magnetic(id,value),motion.getMagneticPreset(value));for(const delta of [-160,-1,0,1,160]){assert.deepEqual(r.drag(id,{startDisplayWidth:value,physicalDelta:delta}),width.geometryFromDrag({startDisplayWidth:value,physicalDelta:delta}));assert.equal(r.outward(id,value,delta),motion.isOutwardBoundaryMotion(value,delta));}}
  const controls=[{id:'min',value:'360'},{id:'mobile',value:'360x599'}];assert.equal(r.controls(id,controls),controls);
 }
});
test('every rendered intermediate width stays within enabled iframe domains, including a gap',()=>{
 for(const enabled of [['mobile'],['tablet'],['desktop'],['mobile','desktop']]){const r=runtime(hero(enabled)),id='media-campaigns';for(let value=216;value<=1160;value+=.25){const rendered=r.displayWidth(id,value),iframe=width.getIframeLogicalWidth(rendered);assert.ok(ranges.filter(range=>enabled.includes(range.id)).some(range=>iframe>=range.minWidth&&(iframe<range.maxWidth||range.maxWidth===width.MAX_LOGICAL_WIDTH)),`${enabled} at ${value}: ${iframe}`);}for(const disabled of ['mobile','tablet','desktop'].filter(id=>!enabled.includes(id)))assert.equal(r.preset(id,disabled),null);}
});
test('custom scene metadata supplies source height, controls, target boundaries and signatures',()=>{
 const h=hero(['desktop']);h.scenes[1].adaptives[2]={...ranges[2],minWidth:1400,maxWidth:1800,presetWidth:1500,height:1200};const r=runtime(h),id='statistics';assert.equal(r.height(id,900),720);assert.equal(r.preset(id,'min').logicalWidth,1400);assert.equal(r.preset(id,'max').logicalWidth,1799);assert.equal(r.outward(id,840,-1),true);assert.equal(r.outward(id,1079.4,1),true);assert.equal(r.outward(id,900,1),false);assert.notEqual(r.signature(id),r.signature('media-campaigns'));
 const controls=r.controls(id,[{id:'min'},{id:'mobile',value:'360x599'},{id:'desktop'},{id:'max'}]);assert.deepEqual(controls.map(c=>[c.value,c.disabled]),[['1400',false],['360x599',true],['1400x1799',false],['1799',false]]);const baseline=runtime(hero());assert.equal(baseline.signature('media-campaigns'),baseline.signature('statistics'));
});
